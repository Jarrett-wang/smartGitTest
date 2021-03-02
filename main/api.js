import axios from 'axios';
import { message as antMessage } from 'antd';
// import {getParameterByName, removeURLParameter} from "../utils/utils";

antMessage.config({ maxCount: 1 });
// api请求实例
// eslint-disable-next-line no-undef
const domain = process.env.NODE_ENV === 'development' ? process.env.WX_SERVER_DOMAIN : SERVER.WX_SERVER_DOMAIN;
const instance = axios.create({
  baseURL: domain + '/api/v1',
  timeout: 20000,
});
// 响应拦截器
instance.interceptors.response.use(function(res) {
  const { code } = res.data;

  return {
    success: code === 0,
    ...res.data
  };
}, function (error) {
  console.log(error);
  // 对响应错误做点什么
  return Promise.reject(error);
});

export default instance
