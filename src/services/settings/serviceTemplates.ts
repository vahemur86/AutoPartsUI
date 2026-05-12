import axios from "axios";

export type ServiceTemplate = {
  id?: number;
  name: string;
  mechanicPrice: number;
  electricianPrice: number;
  sparePartsPrice: number;
};

const BASE_URL = "https://autoparts-ambpc7hjbqhxeebx.canadacentral-01.azurewebsites.net/api/admin/service-templates"





export const getServiceTemplates = async () => {
  const res = await axios.get(BASE_URL);
  return res.data;
};

export const createServiceTemplate = async (
  payload: ServiceTemplate,
) => {
  const res = await axios.post(BASE_URL, payload);
  return res.data;
};