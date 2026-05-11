import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/react';
import { ApiKeyForm } from './ApiKeyForm';

export const OnboardingScreen: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Meetwave Flow Builder</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className="ion-padding" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: '15vh' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Welcome</h2>
        <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', marginBottom: 32 }}>
          Connect to your WhatsApp AI backend to start building conversational flows.
        </p>
        <ApiKeyForm onSuccess={onComplete} />
      </div>
    </IonContent>
  </IonPage>
);
