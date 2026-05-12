import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAdminAuthStore } from '../store/useAdminAuthStore';
import { logout } from '../api/authService';

export const Settings: React.FC = () => {
  const history = useHistory();
  const admin = useAdminAuthStore((s) => s.admin);
  const clearSession = useAdminAuthStore((s) => s.logout);
  const expiresAt = useAdminAuthStore((s) => s.expiresAt);
  const [presentAlert] = useIonAlert();

  const handleLogout = () => {
    presentAlert({
      header: 'Log out',
      message: 'You will need your admin mobile number to log back in.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Log out',
          role: 'destructive',
          handler: async () => {
            await logout();
            clearSession();
            history.replace('/login');
          },
        },
      ],
    });
  };

  const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          <IonItem>
            <IonLabel>
              <p style={{ color: 'var(--ion-color-medium)', fontSize: 12, margin: 0 }}>Name</p>
              <h3>{admin?.name ?? '—'}</h3>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              <p style={{ color: 'var(--ion-color-medium)', fontSize: 12, margin: 0 }}>Mobile</p>
              <h3>+91 {admin?.phone ?? '—'}</h3>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              <p style={{ color: 'var(--ion-color-medium)', fontSize: 12, margin: 0 }}>Session expires</p>
              <h3>{expiresAt ? new Date(expiresAt).toLocaleString() : '—'}</h3>
            </IonLabel>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonItem>
            <IonLabel>
              <p style={{ color: 'var(--ion-color-medium)', fontSize: 12, margin: 0 }}>Backend URL</p>
              <h3 style={{ fontSize: 14 }}>{backendUrl}</h3>
            </IonLabel>
            <IonNote slot="end">VITE_API_BASE_URL</IonNote>
          </IonItem>
          <IonItem>
            <IonLabel>
              <p style={{ color: 'var(--ion-color-medium)', fontSize: 12, margin: 0 }}>App version</p>
              <h3>1.0.0</h3>
            </IonLabel>
          </IonItem>
        </IonList>

        <div style={{ padding: 16 }}>
          <IonButton expand="block" color="danger" fill="outline" onClick={handleLogout}>
            Log out
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};
