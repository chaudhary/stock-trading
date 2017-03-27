raw_config = Yamler.load("#{Rails.root}/config/yaml/omniauth_config.yml")[Rails.env]
OMNIAUTH_CONFIG = HashWithIndifferentAccess.new(raw_config)
