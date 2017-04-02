class User
  include Mongoid::Document
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :omniauthable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :remember_me

  field :email,              type: String, default: ""
  field :encrypted_password, type: String, default: ""

  field :reset_password_token,   type: String
  field :reset_password_sent_at, type: Time

  field :remember_created_at, type: Time

  field :sign_in_count,      type: Integer, default: 0
  field :current_sign_in_at, type: Time
  field :last_sign_in_at,    type: Time
  field :current_sign_in_ip, type: String
  field :last_sign_in_ip,    type: String


  field :name, type: String
  field :dob, type: Date
  field :dob_month, type: Integer
  field :dob_day, type: Integer
  field :dob_year, type: Integer

  field :profile_title, type: String

  embeds_many :emails, cascade_callbacks: true
  embeds_many :authentications, as: :authenticatable, cascade_callbacks: true

  validates :password, presence: {if: :password_required?}, length: {within: 6..128, allow_blank: true}

  scope :with_confirmed_email, ->(email) { where(:emails.matches => {:email => email, :confirmed_at.ne => nil}) }

  def password_required?
    !(self.persisted?) && self.authentications.blank? && self.encrypted_password.blank?
  end

  def primary_email
    email_doc = self.emails.where(is_primary: true).first
    email_doc ||= self.emails.where(:confirmed_at.ne => nil).order_by(:confirmed_at.asc).first
    email_doc ||= self.emails.order_by(:confirmation_sent_at.asc).first
    email_doc.email
  end

  alias :email :primary_email
end
