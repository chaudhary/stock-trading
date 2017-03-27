json.data do
  json.name user_request.name
  json.email user_request.email
  json.profile_title user_request.profile_title

  if user_request.dob.present?
    json.dob_day user_request.dob.day
    json.dob_month user_request.dob.month
    json.dob_year user_request.dob.year
  end
  
  json.current_city do
    json.id user_request.current_city.id
    json.name user_request.current_city.name
  end if user_request.current_city.present?

  json.currently_at do
    json.id user_request.currently_at.id
    json.name user_request.currently_at.name
  end if user_request.currently_at.present?

  json.invite_token user_request.token
end if user_request.present?