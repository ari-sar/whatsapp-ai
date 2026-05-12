import { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSpinner,
  IonTextarea,
  IonText,
  IonTitle,
  IonToolbar,
  IonButtons,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { add, close, save } from 'ionicons/icons';
import { createKeyword, deleteKeyword, listKeywords, updateKeyword } from '../api/keywordsService';
import { Keyword } from '../types/keyword';

export const Keywords: React.FC = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Keyword | null>(null);
  const [trigger, setTrigger] = useState('');
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  const load = async () => {
    try {
      setLoading(true);
      const data = await listKeywords();
      setKeywords(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setTrigger('');
    setResponse('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (kw: Keyword) => {
    setEditing(kw);
    setTrigger(kw.trigger);
    setResponse(kw.responseMessage);
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    const t = trigger.trim().toLowerCase();
    const r = response.trim();
    if (!t || !r) {
      setError('Both trigger and response are required.');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        const updated = await updateKeyword(editing.id, { trigger: t, responseMessage: r });
        setKeywords((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
        presentToast({ message: 'Keyword updated', duration: 1500, color: 'success' });
      } else {
        const created = await createKeyword({ trigger: t, responseMessage: r });
        setKeywords((prev) => [...prev, created]);
        presentToast({ message: 'Keyword added', duration: 1500, color: 'success' });
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save keyword');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (kw: Keyword) => {
    presentAlert({
      header: 'Delete keyword',
      message: `Remove trigger "${kw.trigger}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try {
              await deleteKeyword(kw.id);
              setKeywords((prev) => prev.filter((k) => k.id !== kw.id));
              presentToast({ message: 'Keyword removed', duration: 1500 });
            } catch (err: any) {
              presentToast({ message: err.message ?? 'Failed to delete', duration: 2000, color: 'danger' });
            }
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Keywords</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <IonSpinner name="dots" />
          </div>
        ) : keywords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--ion-color-medium)' }}>
            <p>No keywords yet.</p>
            <p style={{ fontSize: 13 }}>Tap the + button to create your first one.</p>
          </div>
        ) : (
          <IonList>
            {keywords.map((kw) => (
              <IonItemSliding key={kw.id}>
                <IonItem button onClick={() => openEdit(kw)}>
                  <IonLabel>
                    <h2>{kw.trigger}</h2>
                    <p style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kw.responseMessage}</p>
                  </IonLabel>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption color="danger" onClick={() => handleDelete(kw)}>
                    Delete
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={openCreate}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={modalOpen} onDidDismiss={() => setModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editing ? 'Edit keyword' : 'New keyword'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setModalOpen(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Trigger word</IonLabel>
              <IonInput
                value={trigger}
                onIonInput={(e) => setTrigger(String(e.detail.value ?? ''))}
                placeholder="e.g. price, hours, location"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Reply message</IonLabel>
              <IonTextarea
                rows={4}
                value={response}
                onIonInput={(e) => setResponse(String(e.detail.value ?? ''))}
                placeholder="What should we send when a customer types the trigger?"
              />
            </IonItem>
            {error && (
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
            )}
            <IonButton expand="block" onClick={handleSave} disabled={saving} style={{ marginTop: 16 }}>
              <IonIcon slot="start" icon={save} />
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};
