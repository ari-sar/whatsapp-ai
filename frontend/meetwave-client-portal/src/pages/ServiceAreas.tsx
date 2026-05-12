import { useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { add, close, save, trash } from 'ionicons/icons';
import {
  ServiceArea,
  bulkCreateServiceAreas,
  createServiceArea,
  deleteServiceArea,
  listServiceAreas,
} from '../api/serviceAreasService';

const PINCODE_RE = /^\d{6}$/;

export const ServiceAreas: React.FC = () => {
  const [items, setItems] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [single, setSingle] = useState('');
  const [bulk, setBulk] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  const load = async () => {
    try {
      setLoading(true);
      setItems(await listServiceAreas());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setSingle('');
    setBulk('');
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    const s = single.trim();
    const bulkList = bulk
      .split(/[\n,]+/)
      .map((v) => v.trim())
      .filter(Boolean);

    if (!s && bulkList.length === 0) {
      setError('Enter a pincode or paste a list.');
      return;
    }

    try {
      setSaving(true);
      if (bulkList.length > 0) {
        const invalid = bulkList.filter((p) => !PINCODE_RE.test(p));
        if (invalid.length) {
          setError(`Invalid pincodes: ${invalid.slice(0, 5).join(', ')}${invalid.length > 5 ? '…' : ''}`);
          return;
        }
        const updated = await bulkCreateServiceAreas(bulkList);
        setItems(updated);
        presentToast({ message: `Added ${bulkList.length} pincodes`, duration: 1500, color: 'success' });
      } else {
        if (!PINCODE_RE.test(s)) {
          setError('Pincode must be 6 digits.');
          return;
        }
        const created = await createServiceArea(s);
        setItems((prev) => [...prev, created].sort((a, b) => a.pincode.localeCompare(b.pincode)));
        presentToast({ message: 'Pincode added', duration: 1500, color: 'success' });
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (area: ServiceArea) => {
    presentAlert({
      header: 'Remove pincode',
      message: `Stop serving ${area.pincode}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            try {
              await deleteServiceArea(area.id);
              setItems((prev) => prev.filter((a) => a.id !== area.id));
              presentToast({ message: 'Removed', duration: 1500 });
            } catch (err: any) {
              presentToast({
                message: err.response?.data?.error ?? 'Failed to remove',
                duration: 2000,
                color: 'danger',
              });
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
          <IonTitle>Service Areas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <IonSpinner name="dots" />
          </div>
        ) : (
          <IonList>
            <IonListHeader>
              <IonLabel>
                <h2>Your serviceable pincodes</h2>
                <p>
                  <IonNote>
                    Flows can check whether a customer's pincode is in this list and respond accordingly.
                  </IonNote>
                </p>
              </IonLabel>
            </IonListHeader>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--ion-color-medium)' }}>
                <IonText>
                  <p>No pincodes added yet.</p>
                </IonText>
                <p style={{ fontSize: 13 }}>Tap + to add pincodes you can deliver / serve.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 16 }}>
                {items.map((area) => (
                  <IonChip key={area.id} onClick={() => handleDelete(area)}>
                    <IonLabel>{area.pincode}</IonLabel>
                    <IonIcon icon={trash} />
                  </IonChip>
                ))}
              </div>
            )}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={openAdd}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={modalOpen} onDidDismiss={() => setModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Add pincodes</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setModalOpen(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Single pincode</IonLabel>
              <IonInput
                value={single}
                placeholder="e.g. 400001"
                inputmode="numeric"
                maxlength={6}
                onIonInput={(e) => setSingle(String(e.detail.value ?? ''))}
              />
            </IonItem>
            <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', margin: 16 }}>or</p>
            <IonItem>
              <IonLabel position="stacked">Bulk paste (one per line or comma-separated)</IonLabel>
              <IonTextarea
                rows={6}
                value={bulk}
                placeholder={'400001\n400053\n110001'}
                onIonInput={(e) => setBulk(String(e.detail.value ?? ''))}
              />
            </IonItem>
            {error && (
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
            )}
            <IonButton expand="block" onClick={handleSave} disabled={saving} style={{ marginTop: 16 }}>
              <IonIcon slot="start" icon={save} />
              {saving ? 'Saving…' : 'Save'}
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};
