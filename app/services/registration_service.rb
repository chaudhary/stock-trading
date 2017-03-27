module RegistrationService

  extend self

  def confirm_request(user_request)
    return if user_request.blank?

    user_request.confirmed_at = Time.now.utc
    user_request.save!

    user = create_user(user_request) if user_request.convertable_to_user?
    return user.present? ? user : user_request
  end

  def create_user_request(user_params)
    if user_params[:authentication].present?
      user_params[:email] ||= user_params[:authentication][:email]
      user_params[:name] ||= user_params[:authentication][:name]
      user_params[:currently_at] ||= user_params[:authentication][:currently_at]
      user_params[:current_city] ||= user_params[:authentication][:current_city]
      user_params[:profile_title] ||= user_params[:authentication][:profile_title]
    end
    user_params[:email] = user_params[:email].to_s.downcase
    taken_users = ::User.with_confirmed_email(user_params[:email])
    raise ::AppException.new("You must have signed up with us earlier using #{user_params[:email]}, please try signing in.") if taken_users.present?

    user_request = ::UserRequest.find_or_initialize_by(:email => user_params[:email])
    user_request.name = user_params[:name]
    user_request.profile_title = user_params[:profile_title]
    user_request.password = user_params[:password]
    if user_params[:dob_day].present? && user_params[:dob_month].present? && user_params[:dob_year].present?
      user_request.dob = [user_params[:dob_day], user_params[:dob_month], user_params[:dob_year]].join("/")
    end

    currently_at_id = user_params[:currently_at].try(:[], :id)
    currently_at_id = ::Institution.create_from_id(currently_at_id) if currently_at_id.present?
    user_request.currently_at_id = currently_at_id

    current_city_id = user_params[:current_city].try(:[], :id)
    current_city = ::Location.where(:_id => current_city_id).first if current_city_id.present?
    user_request.current_city = current_city

    user_request.confirmed_at = nil unless user_request.valid_token?(user_params[:invite_token])

    user_request.authentications = []
    if user_params[:authentication].present?
      ::Authentication.create_or_update_authentication(user_request, user_params[:authentication])
    end

    user_request.save!

    if user_request.confirmed?
      user = create_user(user_request)
    else
      ::Reliable::Transactional::ConfirmationMailer.delay.user_request_confirmation(request_log)
    end
    return user.present? ? user : user_request
  end

  def create_user(user_request)
    taken_user = ::User.where(:emails.matches => {:email => user_request.email,:confirmed_at.ne => nil}).first
    raise ::AppException.new("You must have signed up with us earlier using #{user_request.email}, please try signing in.") if taken_user.present?

    user_request.authentications.each do |auth|
      taken_user = ::User.where(:authentications.matches => {:provider => auth.provider, :uid => auth.uid}).first
      raise ::AppException.new("You must have signed up with us earlier using #{auth.provider}, please try signing in.") if taken_user.present?

      taken_user = ::User.where(:emails.matches => {:confirmed_at.ne => nil, :email => auth.linked_email}).first
      raise ::AppException.new("You must have signed up with us earlier using #{auth.linked_email}, please try signing in.") if taken_user.present?
    end

    user = ::User.new
    user.name = user_request.name
    user.currently_at = user_request.currently_at
    user.current_city = user_request.current_city
    user.profile_title = user_request.profile_title
    user.dob = user_request.dob

    email_doc = user.emails.build
    email_doc.email = user_request.email
    email_doc.confirmed_at = Time.now.utc
    email_doc.no_confirm = true if user_request.confirmed_at.blank?

    user.encrypted_password = user_request.encrypted_password
    user_request.authentications.each do |authentication|
      ::Authentication.create_or_update_authentication(user, authentication.as_hash)
      next if authentication.linked_email.blank?

      email_doc = user.emails.find_or_initialize_by(:email => authentication.linked_email)
      email_doc.confirmed_at = Time.now.utc
      email_doc.no_confirm = true
    end

    user.save!
    return user
  end

end
