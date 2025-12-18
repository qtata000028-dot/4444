import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import './index.css';
import App from './App';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BoardPage } from './pages/BoardPage';
import { StepsPage } from './pages/StepsPage';
import { OrdersPage } from './pages/OrdersPage';
import { CalendarPage } from './pages/CalendarPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ImpactPage } from './pages/ImpactPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/board"
          element={(
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/steps"
          element={(
            <ProtectedRoute>
              <StepsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/orders"
          element={(
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/calendar"
          element={(
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/employees"
          element={(
            <ProtectedRoute role="admin">
              <EmployeesPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/impact"
          element={(
            <ProtectedRoute>
              <ImpactPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/" element={<Navigate to="/board" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
