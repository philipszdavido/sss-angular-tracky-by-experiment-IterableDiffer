import { environment } from './../../environments/environment';

export const apiRoot = environment.httpEndpoint;

export const websocketTokenUrl              = `${apiRoot}/ws-init`;
export const channelUrl 			        = `${apiRoot}/channels`;
export const nodeUrl                        = `${apiRoot}/nodes`;
export const pushAnonBranchUrl 				= `${apiRoot}/push-anon-branch`;
export const pushAuthBranchUrl 				= `${apiRoot}/push-persisted-branch`;
export const traverseUrl 					= `${apiRoot}/traverse-info`;
export const feeedDataStoreUrl 				= `${apiRoot}/feed-datastore`;
export const registerUrl 					= `${apiRoot}/register`;
export const loginUrl 						= `${apiRoot}/login`;
export const logoutUrl 						= `${apiRoot}/logout`;
export const fetchBranchUrl                 = `${apiRoot}/fetch-branch`;
