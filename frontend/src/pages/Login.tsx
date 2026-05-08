import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
  useIonRouter,
} from '@ionic/react';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const Login: React.FC = () => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const setApiKey = useAuthStore((s) => s.setApiKey);
  const router = useIonRouter();

  const handleSubmit = () => {
    if (!key.trim()) {
      setError('API key is required.');
      return;
    }
    setApiKey(key.trim());
    router.push('/app/dashboard', 'root', 'replace');
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: '15vh' }}>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>WhatsApp AI Dashboard</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Admin API Key</IonLabel>
                <IonInput
                  type="password"
                  value={key}
                  onIonInput={(e) => setKey(e.detail.value ?? '')}
                  placeholder="Enter your API key"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </IonItem>
              {error && (
                <IonText color="danger">
                  <p style={{ marginLeft: 16, fontSize: 13 }}>{error}</p>
                </IonText>
              )}
              <IonButton
                expand="block"
                style={{ marginTop: 16 }}
                onClick={handleSubmit}
              >
                Enter Dashboard
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
