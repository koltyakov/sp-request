import {expect} from 'chai';
import * as Promise from 'bluebird';
import {IncomingMessage} from 'http';

import {ISPRequest} from './../../src/core/ISPRequest';
import * as sprequest from './../../src/core/SPRequest';
import {requestDigestCache} from './../../src/core/SPRequest';

let config: any = require('./config');

let listTitle: string = 'SPRequestTesting';

let tests: any[] = [
  {
    name: 'on-premise',
    creds: config.onprem,
    env: config.env,
    url: config.url.onprem
  },
  {
    name: 'online',
    creds: config.online,
    env: undefined,
    url: config.url.online
  }
];

tests.forEach(test => {
  describe(`sp-request: integration - ${test.name}`, () => {
    let request: ISPRequest;

    before('Creating test list', function (done: any): void {
      this.timeout(10 * 1000);

      request = sprequest.create(test.creds, test.env);

      request.requestDigest(test.url)
        .then((digest) => {
          return request.post(`${test.url}/_api/web/lists`, {
            body: {
              '__metadata': { 'type': 'SP.List' },
              'AllowContentTypes': true,
              'BaseTemplate': 100,
              'ContentTypesEnabled': false,
              'Description': 'Test list',
              'Title': listTitle
            },
            headers: {
              'X-RequestDigest': digest
            }
          });
        })
        .then(() => {
          done();
        }, err => {
          if (err.message.indexOf('-2130575342') === -1) {
            done(err);
            return;
          }
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    after('Deleting test list', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      Promise.all([request.requestDigest(test.url), request.get(`${test.url}/_api/web/lists/GetByTitle('${listTitle}')`)])
        .then((data) => {
          let digest: string = data[0];
          let listId: string = data[1].body.d.Id;

          return request.post(`${test.url}/_api/web/lists('${listId}')`, {
            headers: {
              'X-RequestDigest': digest,
              'X-HTTP-Method': 'DELETE',
              'IF-MATCH': '*'
            }
          });
        })
        .then((data) => {
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it('should get list title', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      request.get(`${test.url}/_api/web/lists/GetByTitle('${listTitle}')`)
        .then((data) => {
          expect(data.body.d.Title).to.equal(listTitle);
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it('should create list item', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      request.requestDigest(test.url)
        .then((digest) => {
          return request.post(`${test.url}/_api/web/lists/GetByTitle('${listTitle}')/items`, {
            headers: {
              'X-RequestDigest': digest
            },
            body: { '__metadata': { 'type': `SP.Data.${listTitle}ListItem` }, 'Title': 'Test' }
          });
        })
        .then((data) => {
          expect(data.statusCode).to.equal(201);
          done();
        })
        .catch((err) => {
          done(err);
        });
    });

    it('should get list item by id', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      request.get(`${test.url}/_api/web/lists/GetByTitle('${listTitle}')/items(1)`)
        .then((data) => {
          expect(data.body.d.Title).to.equal('Test');
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });
});

describe('sp-request: integration - on-premise specific tests', () => {
  let request: ISPRequest;

  before('Creating test list', function (done: any): void {
    this.timeout(10 * 1000);

    request = sprequest.create(config.onprem, config.env);

    request.requestDigest(config.url.onprem)
      .then((digest) => {
        return request.post(`${config.url.onprem}/_api/web/lists`, {
          body: {
            '__metadata': { 'type': 'SP.List' },
            'AllowContentTypes': true,
            'BaseTemplate': 100,
            'ContentTypesEnabled': false,
            'Description': 'Test list',
            'Title': listTitle
          },
          headers: {
            'X-RequestDigest': digest
          }
        });
      })
      .then(() => {
        done();
      }, err => {
        if (err.message.indexOf('-2130575342') === -1) {
          done(err);
          return;
        }
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  after('Deleting test list', function (done: MochaDone): void {
    this.timeout(10 * 1000);

    Promise.all([request.requestDigest(config.url.onprem), request.get(`${config.url.onprem}/_api/web/lists/GetByTitle('${listTitle}')`)])
      .then((data) => {
        let digest: string = data[0];
        let listId: string = data[1].body.d.Id;

        return request.post(`${config.url.onprem}/_api/web/lists('${listId}')`, {
          headers: {
            'X-RequestDigest': digest,
            'X-HTTP-Method': 'DELETE',
            'IF-MATCH': '*'
          }
        });
      })
      .then((data) => {
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('should not throw 401 when running multiple simultaneous requests', function (done: MochaDone): void {
    this.timeout(20 * 1000);

    let promises: Promise<IncomingMessage>[] = [];

    requestDigestCache.clear();

    for (let i: number = 0; i < 10; i++) {
      request.requestDigest(config.url.onprem)
        .then(digest => {
          let promise: Promise<IncomingMessage> = request.get(`${config.url.onprem}/_api/web/lists/GetByTitle('${listTitle}')`);
          promises.push(promise);
          return promise;
        })
        .catch(err => {
          done(err);
        });
    }

    Promise.all(promises)
      .then(data => {
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});
