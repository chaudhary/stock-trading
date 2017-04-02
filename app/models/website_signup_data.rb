class WebsiteSignupData
  include Mongoid::Document
  include Mongoid::Timestamps

  field  :data, type: Hash
  field  :omniauth_metadata, type: Hash
end