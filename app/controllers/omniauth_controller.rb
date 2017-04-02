class OmniauthController < ApplicationController
  skip_before_filter :verify_authenticity_token

  FB_TOKEN_ERROR = 'token_error'

  layout 'registration'

#  after_filter :unset_session_variables, only: [:callback]

  def social_sync
    metadata = {key: params[:key], host: request.host, user_id: current_user.try(:id).try(:to_s)}
    session[:omniauth_metadata] = metadata
    redirect_to "/auth/#{params[:provider]}?#{URI.encode_www_form(metadata)}"
  end

  def create
    metadata = request.env['omniauth.params']
    auth_data = request.env['omniauth.auth']
    metadata = session[:omniauth_metadata] if metadata.blank?

    dup_auth_data = auth_data.deep_dup
    dup_auth_data['extra'].delete('access_token')
    session_data = {invited_at: session[:invited_at], invitation_token: session[:invitation_token], invited_via: session[:invited_via]}
    sync_data = ::WebsiteSignupData.new(:data => dup_auth_data.merge(session_data), :omniauth_metadata => metadata)
    sync_data.save!
    session[:sync_data_id] = sync_data.id

    metadata = ::Hashie::Mash.new(metadata)

    if metadata.blank? || auth_data.blank?
      sections = [
          {name: 'Parameters', data: params.to_hash},
          {name: 'Session', data: session.to_hash},
          {name: 'Auth Data', data: auth_data.try(:to_hash)}
      ]
      ::Confirmed::Transactional::ExceptionMailer.delay.diagnostics('Social Sync Failure 1st Callback', sections)
    end
    auth_origin_host = metadata[:host]
    redirect_to auth_callback_url(:provider => params[:provider], :sync_data_id => sync_data.id, :host => auth_origin_host)
  end

  def callback
    sync_data_ids = [params[:sync_data_id], session[:sync_data_id]].compact.uniq
    sync_data = ::WebsiteSignupData.where(:_id.in => sync_data_ids).first if sync_data_ids.present?
    auth_data = sync_data.data if sync_data
    metadata = sync_data.omniauth_metadata if sync_data

    auth_data = ::Hashie::Mash.new(auth_data)
    metadata  = ::Hashie::Mash.new(metadata)

    if metadata.blank? || auth_data.blank?
      sections = [
          {name: 'Parameters', data: params.to_hash},
          {name: 'Session', data: session.to_hash},
          {name: 'Auth Data', data: auth_data.try(:to_hash)}
      ]
      ::Confirmed::Transactional::ExceptionMailer.delay.diagnostics('Social Sync Failure 2nd Callback', sections)
    end
    user = current_user
    user ||= ::User.where(:_id => metadata[:user_id]).first if metadata[:user_id].present?
    @response, @user = OmniAuthService.new(auth_data, metadata, user).add_authentication(sync_data.id)

    if @user.blank? && current_user.blank? && @response[:authentication][:email].present? && @response[:key] == ::OmniAuthService::USER_SIGNUP
      user_params = {authentication: @response[:authentication]}
      @user = ::RegistrationService.create_user_request(user_params)
    end

    if @user.present? && current_user.blank? && @user.is_a?(::User)
      sign_in(@user)
      @response[:redirect_url] = after_sign_in_path_for(@user)
    end

    respond_to do |format|
      format.html { render(layout: nil) }
    end
  end

  def check_authentication
    auth_hash = params[:auth_hash] || {}

    user = User.where(:authentications.matches => {:provider => auth_hash[:provider], :uid => auth_hash[:user_id]}).first if auth_hash[:user_id].present? && auth_hash[:provider].present?
    user ||= User.where(:emails.matches => {:email => auth_hash[:email], :confirmed_at.ne => nil}).first if auth_hash[:email].present?

    if user.present?
      ::Authentication.create_or_update_authentication(user, auth_hash)
      sign_in(user)
      redirect_url = after_sign_in_path_for(user)
    end

    respond_to do |format|
      format.html {}
      format.json { render(json: {redirect_url: redirect_url}) }
    end
  end

  def failure
    reason   = params[:error_reason] || params[:oauth_problem] || :invalid_credentials
    @message = "#{I18n.t(:message, :scope => 'omniauth.failure')} #{I18n.t(reason, :scope => 'omniauth.failure')}"
    respond_to do |format|
      format.html {render layout: nil}
    end
  end

  private
  def unset_session_variables
    session[:fb_permissions]    = nil
    session[:redirect_url]      = nil
#    session[:omniauth_metadata] = nil
    session[:fb_info_fields]    = nil
    session[:ln_info_fields]    = nil
    session[:oauth]             = nil
    session[:auth_data] = nil
  end

  def redirect_url
    current_user ? sneak_peek_posts_url : signup_url
  end

  def redirect_path
    current_user ? sneak_peek_posts_path : root_path
  end

  def revoke_ln_permissions(auth)
    linkedin_api = LinkedinFactory.new(auth.auth_token, auth.auth_secret)
    linkedin_api.client.invalidate_token
  end

  def revoke_fb_permissions(auth)
    begin
      client_access_token = Koala::Facebook::API.new(auth.auth_token)
      return client_access_token.delete_connections('me', 'permissions')
    rescue Exception => ex
      FB_TOKEN_ERROR
    end
  end
end