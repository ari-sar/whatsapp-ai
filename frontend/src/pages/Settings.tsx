import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonRouter,
} from '@ionic/react';
import { useAuthStore } from '@/store/useAuthStore';

const Settings: React.FC = () => {
  const { apiKey, clearApiKey } = useAuthStore();
  const [presentAlert] = useIonAlert();
  const router = useIonRouter();

  const handleLogout = () => {
    presentAlert({
      header: 'Remove API Key',
      message: 'This will log you out and clear the stored key.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            clearApiKey();
            router.push('/login', 'root', 'replace');
          },
        },
      ],
    });
  };

  const masked = apiKey ? `${'•'.repeat(Math.max(0, apiKey.length - 4))}${apiKey.slice(-4)}` : '—';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonMenuButton slot="start" />
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel>API Key</IonLabel>
            <IonNote slot="end">{masked}</IonNote>
          </IonItem>
        </IonList>
        <IonButton
          expand="block"
          color="danger"
          fill="outline"
          style={{ marginTop: 24 }}
          onClick={handleLogout}
        >
          Remove API Key & Log Out
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
