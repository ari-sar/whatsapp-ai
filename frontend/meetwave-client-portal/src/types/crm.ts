export interface Lead {
  id: string;
  client_id: string;
  user_phone: string;
  last_message: string;
  current_flow_id?: string;
  current_step?: string;
  collected_data?: Record<string, any>;
  timestamp: string;
}

export interface Keyword {
  id: string;
  client_id: string;
  trigger: string;
  response_id?: string;
  flow_id?: string;
}

export interface Response {
  id: string;
  message: string;
  media_url?: string;
}

export interface Client {
  id: string;
  shop_name: string;
  phone_number_id: string;
  access_token: string;
  plan: string;
  created_at: string;
  updated_at: string;
}
