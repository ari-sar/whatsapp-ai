import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export const ProtectedRoute: React.FC<RouteProps> = ({ children, ...rest }) => {
  const apiKey = useAuthStore((s) => s.apiKey);

  return (
    <Route
      {...rest}
      render={() =>
        apiKey ? children : <Redirect to="/login" />
      }
    />
  );
};
