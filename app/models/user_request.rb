class UserRequest
  include Mongoid::Document
  include Mongoid::Timestamps

  devise :database_authenticatable
  field :encrypted_password, type: String

  field :token, type: String

  field :name, type: String
  field :email, type: String
  field :profile_title, type: String
  field :dob, type: Date

  embeds_many :authentications, cascade_callbacks: true, as: :authenticatable

  field :confirmed_at, type: Time

  validates :email, format: {with: ::EmailFormatUtility::CUSTOM_EMAIL_REGEX}, presence: true, uniqueness: true

  index :email, background: true, unique: true

  validate :email_taken?
  before_save :generate_token

  def generate_token
    token = self.token
    return token if token.present?

    token = self.class.token
    self.token = token
    return token
  end

  def self.token
    TokenUtility.unique_token(self, 'token')
  end

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


  def valid_token?(token)
    request_logs.where(:token => token).present?
  end

  def confirmed?
    self.confirmed_at.present? ||
    self.authentications.map(&:linked_email).include?(self.email)
  end
end
