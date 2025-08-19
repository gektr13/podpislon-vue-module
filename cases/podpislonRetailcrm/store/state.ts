import { CompanyInfo } from '../interfaces/company';
import { Signatory } from '../interfaces/interface';
import { Keyable } from '../interfaces/keyable';
import { reactive } from 'vue'

export const state = reactive({
  route: <string>'MainView',
  setRouteFromPath(path: string){
    if(path === '/' 
      || path === '/widget'
    ) path = '/main';
    path = path.slice(1);
    path = path[0].toUpperCase() + path.slice(1);
    this.route = path + 'View';
  },
  setClient(data: Keyable){
    this.client = {
      name: data.firstname,
      last_name: data.surname,
      second_name: data.patronymic,
      phone: data.phone,
      email: (data as any).email || '',
      id: data.id
    }
  },
  orderId: <number>0,
  customerId: <number>0,
  accountId: <string>'',
  apiKey: <string>'',
  companyInfo: <CompanyInfo|null> null,
  client: <Signatory|null>null,
  hash: <string> '',
}) 