user = current_user

if user.present?
  json.id user.id
  json.name user.name
  json.facebook_profile_url user.authentications.facebook.try(:url)
  json.linkedin_profile_url user.authentications.linkedin.try(:url)
  
  json.profile_title user.profile_title
  
  json.currently_at do
    json.id user.currently_at_id
    json.name user.currently_at_name
  end if user.currently_at_id.present?
  
  json.current_city do
    json.id user.current_city_id
    json.name user.current_city_name
  end if user.current_city_id.present?
  
  json.image do
    json.id user.image.id if user.image.present?
    json.file_url ::ImageUrlUtility.image_url(user.image, 'profile', 'big')
    json.big_url ::ImageUrlUtility.image_url(user.image, 'profile', 'big')
    json.tile_url ::ImageUrlUtility.image_url(user.image, 'profile', 'tile')
    json.small_url ::ImageUrlUtility.image_url(user.image, 'profile', 'small')
    json.uploaded true
  end
  
  json.profile_url profile_path(user)
end
