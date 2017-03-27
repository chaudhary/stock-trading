class OmniAuthService

  USER_SIGNUP = 'user_signup'

  def initialize(auth_data, metadata, college, user=nil)
    @auth_hash = build_auth_hash(auth_data)
    @metadata = metadata
    @college = college
    @user = user
  end

  def add_authentication(sync_data_id = nil)
    if @metadata[:key] == USER_SIGNUP
      return signup_user
    elsif @metadata[:key] == 'trading'
      trading_sync(sync_data_id)
    elsif @user.present?
      return sync_to_profile
    else
      raise "Error found! current_user is blank and key does not matches with login or signup"
    end
  end

  private

  def trading_sync(sync_data_id)
    return {
      key: @metadata[:key],
      sync_data_id: sync_data_id
    }, nil
  end

  def login_user
    user = ::User.where(:authentications.matches => {:provider => provider, :uid => @auth_hash[:user_id]}).first
    user ||= ::User.where(:emails.matches => {:confirmed_at.ne => nil, :email => @auth_hash[:email]}).first

    if user.present?
      ::Authentication.create_or_update_authentication(user, @auth_hash)
      message = 'Successfully signed in'
    else
      message = "You need to link your #{provider.classify} account with AlmaConnect account first, to be able to sign in with #{provider.classify}."
    end
    return {
      key: @metadata[:key],
      authentication: @auth_hash,
      message: message,
    }, user
  end

  def signup_user
    user = ::User.where(:authentications.matches => {:provider => provider, :uid => @auth_hash[:user_id]}).first
    user ||= ::User.where(:emails.matches => {:confirmed_at.ne => nil, :email => @auth_hash[:email]}).first

    if user.present?
      ::Authentication.create_or_update_authentication(user, @auth_hash)
      message = 'Successfully signed in'
    end

    return {
      key: @metadata[:key],
      authentication: @auth_hash,
      message: message,
    }, user
  end

  def sync_to_profile
    user = ::User.where(:_id.ne => @user.id, :authentications.matches => {:provider => provider, :uid => @auth_hash[:user_id]}).first

    if user.blank?
      ::Authentication.create_or_update_authentication(@user, @auth_hash)
      message = "Successfully linked #{provider.classify} account with AlmaConnect"
      if @user.is_admin? && provider == 'google'
        ::GoogleAnalyticsService.new.fetch_analytics rescue nil
      end
    else
      message = "The #{provider.classify} account is already linked with other AlmaConnect account. Please try some other account."
    end

    return {
      authentication: @auth_hash,
      key: @metadata[:key],
      message: message,
    }, (@user if user.blank?)
  end

  def build_auth_hash(auth_data)
    provider = auth_data['provider']
    headline = auth_data.try(:[], :extra).try(:[], :raw_info).try(:[], :headline)
    profile_title, currently_at_name = headline.split(" at ") if headline.present?

    if auth_data.try(:[], :extra).try(:[], :raw_info).try(:[], :work).present? && currently_at_name.blank?
      last_profession = auth_data[:extra][:raw_info][:work].select{|work| work[:end_date].blank?}.last
      currently_at_name = last_profession[:employer][:name] if last_profession.present?
      profile_title = last_profession[:position].try(:[], :name) if last_profession.present?
    end
    if auth_data.try(:[], :extra).try(:[], :raw_info).try(:[], :education).present? && currently_at_name.blank?
      last_education = auth_data[:extra][:raw_info][:education].select{|education| education[:year].blank? || education[:year][:name].to_i > Time.now.year}.last
      currently_at_name = last_education[:school][:name] if last_education.present?
      profile_title = "Student" if last_education.present?
    end

    currently_at = ::Institution.create_institute(currently_at_name) if currently_at_name.present?
    currently_at = {id: currently_at.id, name: currently_at.name} if currently_at

    current_city_name = auth_data.try(:[], :extra).try(:[], :raw_info).try(:[], :location).try(:[], :name)
    current_city = ::Location.ln_search(current_city_name) if current_city_name.present?
    current_city = {id: current_city.id, name: current_city.location_string} if current_city.present?
    {
      name: auth_data['info']['name'],
      email: auth_data.try(:[], 'info').try(:[], 'email'),
      image_url: auth_data['info']['image'],
      provider: provider,
      provider_url: auth_data.try(:[], 'info').try(:[], 'urls').try(:[], OMNIAUTH_CONFIG[:urls][provider]),
      user_id: auth_data['uid'],
      auth_token: auth_data['credentials']['token'],
      auth_secret: (auth_data['credentials']['secret'] || auth_data['credentials']['refresh_token']),
      expires_at: auth_data['credentials']['expires_at'],
      headline: headline,
      profile_title: profile_title,
      currently_at: currently_at,
      current_city: current_city
    }
  end

  def provider
    @provider ||= @auth_hash[:provider]
  end


end