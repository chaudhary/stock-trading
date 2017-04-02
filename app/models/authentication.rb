class Authentication
  include Mongoid::Document
  include Mongoid::Timestamps

  LINKEDIN = 'linkedin'
  FACEBOOK = 'facebook'
  GOOGLE = 'google'
  YAHOO = 'yahoo'
  HOTMAIL = 'hotmail'

  embedded_in :authenticatable, polymorphic: true

  field :provider, type: String
  field :url, type: String
  field :uid, type: String
  field :auth_token, type: String
  field :auth_secret, type: String
  field :expires_at, type: Time
  field :permissions, type: Array
  field :update_processed_at, type: Time
  field :token_expired_at, type: Time
  field :throttle_reached_at, type: Time
  field :auto_update_enabled, type: Boolean, default: true

  ## todo add validation
  ## email that is fetched in external sources
  field :linked_email, type: String
  field :headline, type: String

  after_save :exchange_fb_token,if: Proc.new { |auth| (auth.provider == Authentication::FACEBOOK && auth.auth_token_changed?) }
  before_save :fetch_permissions,if: Proc.new { |auth| (auth.provider == Authentication::FACEBOOK) }

  after_create :upload_provider_image

  def as_hash
    {
        user_id: uid,
        auth_token: auth_token,
        auth_secret: auth_secret,
        provider_url: url,
        expires_at: expires_at,
        provider: provider,
        email: linked_email,
        headline: headline,
    }
  end

  def url
    url = super
    if !url && uid && provider == FACEBOOK
      "https://www.facebook.com/#{uid}"
    else
      url
    end
  end

  def fetch_permissions
    url = "https://graph.facebook.com/v2.2/#{self.uid}/permissions?access_token=#{self.auth_token}"
    response = JSON.parse(Mechanize.new.get(url).body) rescue nil
    return if response.blank?

    self.permissions = response['data'].select{|p| p['status'] == 'granted'}.map{|p| p['permission']}
  end

  def exchange_fb_token
    begin
      token_info = Koala::Facebook::OAuth.new.exchange_access_token_info(auth_token)
      self.auth_token = token_info['access_token']
      self.expires_at = Time.at(Time.now.to_i + token_info['expires'].to_i)
    rescue Exception => ex
      if ex.message.include?("AuthenticationError") || ex.message.include?("Error validating access token")
        self.token_expired_at = Time.now.utc
      end
    end
  end

  def upload_provider_image
    return true unless self.authenticatable.respond_to?(:image_id)
    return true if self.authenticatable.image_id.present?
    begin
      if self.provider == FACEBOOK
        fb_api = Koala::Facebook::API.new(self.auth_token)
        url = fb_api.get_picture('me', {:type => 'large'})
      elsif self.provider == LINKEDIN
        url = LinkedinFactory.new(self.auth_token, self.auth_secret).client.profile(:id => self.uid, :fields => ['picture_urls::(original)'])[:picture_urls][:all].first
      end

      unless url.blank?
        image = ::Users::ProfileImage.new
        image.absolute_url = url
        image.save
        self.authenticatable.image = image
      end
    rescue Exception => ex
      Rails.logger.error("#{self.class}: Callback skipped - not able to retrieve provider image for user with id #{self.authenticatable.id}")
      Rails.logger.error("#{ex.message}\n#{ex.backtrace}")
    end
  end

  def self.create_or_update_authentication(resource, hashed_data)
    return if hashed_data.blank?

    provider ||= hashed_data[:provider]
    return if provider.blank?

    uid = hashed_data[:user_id]
    return if uid.blank?

    users = ::User.where(:_id.ne => resource.id, :authentications.matches => {:provider => provider, :uid => uid})
    return if users.present?

    auth = resource.authentications.find_or_initialize_by(provider: provider)
    auth.uid = uid if uid
    auth.auth_token = hashed_data[:auth_token] if hashed_data[:auth_token]
    auth.auth_secret = hashed_data[:auth_secret] if hashed_data[:auth_secret]
    auth.expires_at = hashed_data[:expires_in].seconds.from_now if hashed_data[:expires_in]
    auth.expires_at = hashed_data[:expires_at] if hashed_data[:expires_at]
    auth.url = hashed_data[:provider_url] if hashed_data[:provider_url]
    auth.token_expired_at = nil
    auth.linked_email = hashed_data[:email] if hashed_data[:email]
    # Condidtional save to avoid multiple publisher subcriber calls when new user account is created
    auth.save if auth._root.persisted?
  end

end
