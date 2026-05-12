import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { IonButton, IonSelect, IonSelectOption, useIonAlert, IonIcon } from '@ionic/react';
import { trash } from 'ionicons/icons';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes/nodeTypes';
import { useFlowBuilder } from './hooks/useFlowBuilder';
import { NodeInspector } from './NodeInspector';

export const FlowCanvas: React.FC = () => {
  const builder = useFlowBuilder();
  const [presentAlert] = useIonAlert();

  const selectedNode = useMemo(
    () => builder.nodes.find((n) => n.id === builder.selectedNodeId) ?? null,
    [builder.nodes, builder.selectedNodeId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      builder.handleNodesChange(applyNodeChanges(changes, builder.nodes));
    },
    [builder]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      builder.handleEdgesChange(applyEdgeChanges(changes, builder.edges));
    },
    [builder]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      builder.handleEdgesChange(addEdge({ ...connection, id: `${connection.source}__${connection.target}__${Date.now().toString(36)}` }, builder.edges));
    },
    [builder]
  );

  const handleAddNode = (type: string) => builder.addNewNode(type);

  const handleDeleteSelected = () => {
    if (!builder.selectedNodeId) return;
    presentAlert({
      header: 'Delete Node',
      message: `Remove step "${builder.selectedNodeId}"?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => builder.deleteNode(builder.selectedNodeId!),
        },
      ],
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)', minHeight: 500, width: '100%' }}>
      <div
        style={{
          padding: 8,
          borderBottom: '1px solid var(--ion-color-light)',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <IonSelect
          interfaceOptions={{ header: 'Add Node' }}
          placeholder="Add step"
          value=""
          onIonChange={(e) => {
            if (e.detail.value) {
              handleAddNode(e.detail.value);
              (e.target as HTMLIonSelectElement).value = '';
            }
          }}
        >
          <IonSelectOption value="start">Start</IonSelectOption>
          <IonSelectOption value="text">Text Input</IonSelectOption>
          <IonSelectOption value="list">List Menu</IonSelectOption>
          <IonSelectOption value="button">Button Choice</IonSelectOption>
          <IonSelectOption value="condition">Condition</IonSelectOption>
          <IonSelectOption value="end">End</IonSelectOption>
        </IonSelect>
        <IonButton
          fill="clear"
          color="danger"
          onClick={handleDeleteSelected}
          disabled={!builder.selectedNodeId}
        >
          <IonIcon slot="start" icon={trash} /> Delete
        </IonButton>
      </div>

      {builder.error && (
        <div style={{ padding: 8, background: '#ffe0e0', color: '#c00', fontSize: 12 }}>{builder.error}</div>
      )}

      <div style={{ flex: 1, display: 'flex', minHeight: 0, height: '100%' }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%' }}>
          <ReactFlow
            style={{ width: '100%', height: '100%' }}
            nodes={builder.nodes}
            edges={builder.edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => builder.setSelectedNodeId(node.id)}
            onPaneClick={() => builder.setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        <div style={{ width: 360, borderLeft: '1px solid var(--ion-color-light)', overflow: 'hidden' }}>
          <NodeInspector
            node={selectedNode}
            edges={builder.edges}
            onPatchData={builder.updateSelectedNodeData}
            onRename={builder.renameSelectedNode}
          />
        </div>
      </div>
    </div>
  );
};
