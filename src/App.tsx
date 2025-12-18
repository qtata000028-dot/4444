import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { BoardPage } from './pages/Board';
import { OrdersPage } from './pages/Orders';
import { StepsPage } from './pages/Steps';
import { ImpactPage } from './pages/Impact';
import { TablesPage } from './pages/Tables';
import { MePage } from './pages/Me';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
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
          path="/orders"
          element={(
            <ProtectedRoute>
              <OrdersPage />
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
          path="/impact"
          element={(
            <ProtectedRoute>
              <ImpactPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/tables"
          element={(
            <ProtectedRoute>
              <TablesPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/me"
          element={(
            <ProtectedRoute>
              <MePage />
            </ProtectedRoute>
          )}
        />
        <Route path="/" element={<Navigate to="/board" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
