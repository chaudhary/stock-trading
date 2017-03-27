StockTrading::Application.routes.draw do
  root :to => 'registration#index'
  get 'contributions/sneak_peek' => 'contributions#sneak_peek', as: :sneak_peek_posts

  post 'signin'  => 'registration#signin'

  devise_scope :user do
    post '/password' => 'users/passwords#create'
    get '/password/edit' => 'users/passwords#edit'#compatibility route, can be removed after 10th Jan, 2017
    get '/password/:reset_password_token' => 'users/passwords#edit', as: :edit_user_password
    post '/password/:reset_password_token' => 'users/passwords#update'

    get '/confirmations/confirm_email' => 'users/confirmations#confirm_email' #compatibility route, can be removed after 10th Jan, 2017
    post '/confirmations' => 'users/confirmations#resend_email', as: :resend_confirmation_email
    get '/confirmations/:confirmation_token' => 'users/confirmations#confirm_email', as: :confirm_user_email
  end

  devise_for :users, skip: [:registrations, :confirmations, :passwords], controllers: {
      :omniauth_callbacks => "omniauth"
  }, path: '', path_names: {sign_out: "signout", sign_in: 'signin'}
end
