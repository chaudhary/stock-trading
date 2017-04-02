class Email
  include Mongoid::Document

  field :confirmed_at, type: Time
  field :confirmation_sent_at, type: Time
  field :is_primary, type: Boolean
  field :confirmation_token, type: String
  field :email, :type => String
  field :no_confirm, type: Boolean, default: false

  # Recoverable
  field :reset_password_token, type: String
  field :reset_password_sent_at, type: Time


  embedded_in :user, :inverse_of => :emails

  validates :email, format: {with: ::EmailFormatUtility::CUSTOM_EMAIL_REGEX}, presence: true

  validate :cant_add, on: :create, if: Proc.new { |email| email._root.is_a?(::User)}
  validate :already_taken, on: :create
  validate :not_changed
  validate :not_primary, on: :destroy, if: Proc.new { |email| email._root.is_a?(::User)}
  validate :valid_primary, if: Proc.new { |email| email.is_primary_changed?}

  before_save :generate_confirmation_token

  def email=(email)
    super(email.downcase)
  end

  private

  def cant_add
    if self.user.emails.where(:_id.ne => self.id).count > 0 &&
        self.user.emails.where(:confirmed_at.ne => nil).count == 0
      self.errors.add(:base, "can't add more emails until atleast one of the emails is confirmed")
    end
  end

  def not_changed
    if email_changed? && email_was
      errors.add(:email, "can not be edited")
    end
  end

  def not_primary
    if self.email == self.user.primary_email_doc.try(:email)
      errors.add(:base, 'can not destroy primary email')
    end
  end

  def already_taken
    if User.where(:_id.ne => self._root.id, :emails.matches => {email: self.email, :confirmed_at.ne => nil}).count > 0
      errors.add(:base, 'can not add email, already confirmed by other user')
    end
  end

  def generate_confirmation_token
    if self.confirmation_token.blank? && self.confirmed_at.blank?
      self.confirmation_token = TokenUtility.unique_token(User, 'emails.confirmation_token')
    end
  end

  def valid_primary
    errors.add(:base, "You can't set an unconfirmed email as primary") if self.confirmed_at.blank? && self.is_primary
  end

end
