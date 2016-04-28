import {OptionsWithUrl} from 'request';
import * as Promise from 'bluebird';

import {IAuthResolver} from './IAuthResolver';
import {IAuthOptions} from './IAuthOptions';

export class OAuthResolver implements IAuthResolver {
  public ApplyAuthHeaders (authOptions: IAuthOptions):  Promise<OptionsWithUrl> {
    return null;
  }
}