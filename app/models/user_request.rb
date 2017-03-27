class UserRequest
  include Mongoid::Document
  include Mongoid::Timestamps

  devise :database_authenticatable
  field :encrypted_password, type: String

  field :name, type: String
  field :email, type: String
  field :profile_title, type: String
  field :dob, type: Date

  field :is_official, type: Boolean
  field :about, type: String
  field :contact_info, type: String

  belongs_to :current_city, class_name: 'Location', inverse_of: nil
  belongs_to :currently_at, class_name: 'Institution', inverse_of: nil

  embeds_many :authentications, cascade_callbacks: true, as: :authenticatable

  field :confirmed_at, type: Time

  validates :email, format: {with: ::EmailFormatUtility::CUSTOM_EMAIL_REGEX}, presence: true, uniqueness: true

  index :email, background: true, unique: true

  validate :email_taken?

  def email_taken?
    if ::User.where(:emails.matches => {:email => self.email, :confirmed_at.gt => Time.at(0)}).present?
      errors.add(:email, "is already taken by a user")
    end
  end

  def convertable_to_user?
    return false unless confirmed?
    return false if name.blank? || email.blank?
    return false if encrypted_password.blank? && self.authentications.blank?
    return true
  end


  def request_logs
    @request_logs ||= ::UserRequestLog::Base.where(:email => self.email)
  end

  def valid_token?(token)
    request_logs.where(:token => token).present?
  end

  def confirmed?
    self.confirmed_at.present? ||
    self.authentications.map(&:linked_email).include?(self.email)
  end
end
