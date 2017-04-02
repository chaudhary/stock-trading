module TokenUtility
  extend self

  def unique_token(model, for_field)
    loop do
      token = ::Devise.friendly_token
      break token if is_unique?(model, for_field, token)
    end
  end

  def is_unique?(model, field, token)
    model.where(field.to_sym => token).blank?
  end
end