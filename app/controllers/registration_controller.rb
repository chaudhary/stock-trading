class RegistrationController < ApplicationController
  layout 'registration'

  before_filter :require_no_user

  def index
    @token = params[:token]

    user_request = ::UserRequest.where(:token => @token).first
    resource = ::RegistrationService.confirm_request(user_request)

    if resource.is_a?(::User)
      sign_in(resource)
      redirect_to after_sign_in_path_for(resource)
    else
      @user_request = resource
      respond_to do |format|
        format.html {}
        format.json {}
      end
    end
  end

  def signup
    user = ::RegistrationService.create_user_request(params[:user])
    server_status  = 200
    if user.is_a?(::User)
      server_message = 'Your account is successfully created!'
      redirect_url = after_sign_in_path_for(resource)
      sign_in(user)
    else
      server_message = 'We have sent a confirmation email, please refer it to proceed further.'
    end

    respond_to do |format|
      format.html {}
      format.json { render(json: {server_message: server_message, redirect_url: redirect_url}, status: server_status) }
    end
  end

  def signin
    user = ::User.find_for_database_authentication(params[:user])
    raise ::AppException.new("No account found for this email") if user.blank?
    raise ::AppException.new("The password that you've entered is incorrect") unless user.valid_password?(params[:user][:password])

    sign_in(:user, user)
    auth_params = params[:user][:authentication]
    if user.present? && auth_params.present?
      auth_params = HashWithIndifferentAccess.new(JSON.parse auth_params)
      ::Authentication.create_or_update_authentication(user, auth_params)
    end
    redirect_url = after_sign_in_path_for(user)

    respond_to do |format|
      format.json { render(json: {redirect_url: redirect_url}, status: 200) }
    end
  end

end
