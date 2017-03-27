Rails.application.config.middleware.use OmniAuth::Builder do
  provider :instagram, OMNIAUTH_CONFIG[:instagram][:app_key], OMNIAUTH_CONFIG[:instagram][:secret],
           {
               :scope => 'basic',
               :client_options => {:ssl => {:ca_path => '/etc/ssl/certs'}},
               :info_fields => 'id,email,first_name,last_name,link,location,name',
               :setup => true,
               :display => 'popup',
               :secure_image_url => true
           }
  provider :facebook, OMNIAUTH_CONFIG[:facebook][:app_key], OMNIAUTH_CONFIG[:facebook][:secret],
           {
               :scope => 'email,user_education_history,user_work_history,user_location,user_birthday,user_photos,user_posts,user_friends',
               :client_options => {:ssl => {:ca_path => '/etc/ssl/certs'}},
               :info_fields => 'id,email,first_name,last_name,link,location,name',
               :setup => true,
               :display => 'popup',
               :secure_image_url => true
           }
  provider :linkedin, OMNIAUTH_CONFIG[:linkedin][:app_key], OMNIAUTH_CONFIG[:linkedin][:secret],
           {
               :scope => 'r_basicprofile r_emailaddress',
               :fields => %w(id email-address first-name last-name headline industry picture-url public-profile-url location),
               :setup => true,
               :display => 'popup',
               :secure_image_url => true
           }
  provider :google_oauth2, OMNIAUTH_CONFIG[:google][:app_key], OMNIAUTH_CONFIG[:google][:secret],
          {
            :name => "google",
            :scope => "profile, contacts",
            :setup => true,
            :prompt => "select_account",
            :image_aspect_ratio => "square",
            :image_size => 200
          }
  provider :yahoo_oauth2, OMNIAUTH_CONFIG[:yahoo][:app_key], OMNIAUTH_CONFIG[:yahoo][:secret],
          {
            name: 'yahoo'
          }
  provider :windowslive, OMNIAUTH_CONFIG[:hotmail][:app_key], OMNIAUTH_CONFIG[:hotmail][:secret],
          {
            :name => 'hotmail',
#            :scope => "wl.basic, wl.contacts_emails, wl.contacts_phone_numbers",
            :scope => "wl.basic, wl.contacts_emails",
          }
end
OmniAuth.config.on_failure = OmniauthController.action(:failure)