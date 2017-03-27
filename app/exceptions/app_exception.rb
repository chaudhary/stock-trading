class AppException < StandardError
  def initialize(message='Something went wrong! Please try again')
    super
  end
end
