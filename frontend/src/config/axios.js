import axios from 'axios';

const clienteAxios = axios.create({
    baseURL: '/api'
});

export default clienteAxios;