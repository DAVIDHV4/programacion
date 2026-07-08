import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Registro from './pages/Registro';
import HorariosMedicos from './pages/HorariosMedicos';
import EditarHorario from './pages/EditarHorario';
import AtencionesMedicas from './pages/AtencionesMedicas';
import NuevoHorarioDia from './pages/NuevoHorarioDia';
import NuevoHorarioMes from './pages/NuevoHorarioMes'
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/registro/:id" element={<Registro />} />
          <Route path="/horarios" element={<HorariosMedicos />} />
          <Route path="/horarios/editar/:medico/:fecha/:horaInicio" element={<EditarHorario />} />
          <Route path="/atenciones" element={<AtencionesMedicas />} />
          <Route path="/horarios/nuevo-dia" element={<NuevoHorarioDia />} />
          <Route path="/horarios/nuevo-mes" element={<NuevoHorarioMes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;