/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename index.router.ts                                                    │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Nov 27, 2022                                                  │
 * │ Contact: contato@codechat.dev                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Cleber Wilson 2022. All rights reserved.                        │
 * │ Licensed under the Apache License, Version 2.0                               │
 * │                                                                              │
 * │  @license "https://github.com/code-chat-br/whatsapp-api/blob/main/LICENSE"   │
 * │                                                                              │
 * │ You may not use this file except in compliance with the License.             │
 * │ You may obtain a copy of the License at                                      │
 * │                                                                              │
 * │    http://www.apache.org/licenses/LICENSE-2.0                                │
 * │                                                                              │
 * │ Unless required by applicable law or agreed to in writing, software          │
 * │ distributed under the License is distributed on an "AS IS" BASIS,            │
 * │ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     │
 * │                                                                              │
 * │ See the License for the specific language governing permissions and          │
 * │ limitations under the License.                                               │
 * │                                                                              │
 * │ @enum {HttpStatus}                                                           │
 * │ @constant router                                                             │
 * │ @constant authType                                                           │
 * │ @constant guards                                                             │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { RequestHandler, Router } from 'express';
import { Auth, ConfigService, configService } from '../../config/env.config';
import { instanceExistsGuard, instanceLoggedGuard } from '../guards/instance.guard';
import { authGuard } from '../guards/auth.guard';
import { ChatRouter } from './chat.router';
import { GroupRouter } from './group.router';
import { InstanceRouter } from './instance.router';
import { MessageRouter } from './sendMessage.router';
import { ViewsRouter } from './view.router';
import { WebhookRouter } from './webhook.router';
import { instanceController, sendMessageController } from '../whatsapp.module';
import { RouterBroker } from '../abstract/abstract.router';
import { InstanceDto } from '../dto/instance.dto';

enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NOT_FOUND = 404,
  FORBIDDEN = 403,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  INTERNAL_SERVER_ERROR = 500,
}

const router = Router();
const authType = configService.get<Auth>('AUTHENTICATION').TYPE;
const guards = [instanceExistsGuard, instanceLoggedGuard, authGuard[authType]];
const devRouter = Router();

devRouter
  .get('/init', async (req, res) => {
    const { id, ts } = req.query as { id: string; ts: string };

    console.log(id, 'id');

    try {
      const response = await instanceController.fetchInstances({
        instanceName: id,
      });
      console.log('response', response);
      res.send(response);
    } catch (e) {
      console.log(e);
      //!  time out issue
      if (e.status == 404) {
        const response = await instanceController.createInstance({ instanceName: id });
        const connect = await instanceController.connectToWhatsapp({
          instanceName: response.instance.instanceName,
        });
        res.send(connect);
      }
    }

    // const dummy = new DummyRouter(configService, ...guards);

    // const response = await dummy.fetchInstances(req);
  })
  .get('/send-message', async (req, res) => {
    const { to_phone, message, id } = req.query as {
      to_phone: string;
      message: string;
      id: string;
    };

    console.log(to_phone, message, id);

    try {
      const response = await sendMessageController.sendText(
        { instanceName: id },
        {
          textMessage: { text: message },
          number: to_phone,
          options: {
            delay: 1200,
          },
        },
      );

      console.log(response);

      res.send({ response });
    } catch (error) {
      console.log(error);
    }
  })
  .get('/broadcast-message', (req, res) => {
    res.send({ sucess: true });
  })
  .get('/get-details', (req, res) => {
    res.send({ sucess: true });
  })
  .get('/on-whatsapp', (req, res) => {
    res.send({ sucess: true });
  })
  .get('/check-tenant', (req, res) => {
    res.send({ sucess: true });
  });

router
  .use('/dev', devRouter)
  .use(
    '/instance',
    new InstanceRouter(configService, ...guards).router,
    new ViewsRouter(instanceExistsGuard).router,
  )
  .use('/message', new MessageRouter(...guards).router)
  .use('/chat', new ChatRouter(...guards).router)
  .use('/group', new GroupRouter(...guards).router)
  .use('/webhook', new WebhookRouter(...guards).router);

export { router, HttpStatus };

// GET | http://localhost:3000/dev/init                                             │
// │   GET | http://localhost:3000/dev/send-message                                     │
// │   GET | http://localhost:3000/dev/broadcast-message                                │   │
// │   GET | http://localhost:3000/dev/get-details                                      │         │
// │   GET | http://localhost:3000/dev/on-whatsapp                                      │         │
// │   GET | http://localhost:3000/dev/check-tenant                                     │
