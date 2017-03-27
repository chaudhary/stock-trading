class ApplicationController < ActionController::Base
  protect_from_forgery

  def require_no_user
    redirect_to after_sign_in_path_for(current_user) if current_user.present?
  end

  def after_sign_in_path_for(resource)
    return params[:redirect_url] if params[:redirect_url].present?

    if session[:user_return_to].present?
      redirect_path = session[:user_return_to]
      session[:user_return_to] = nil
      return redirect_path
    end

    sneak_peek_posts_path
  end
end
