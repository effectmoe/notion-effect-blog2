import * as React from 'react'
import { useNotionContext } from 'react-notion-x'

export const CollectionWithDefaultListView: React.FC<any> = (props) => {
  const { recordMap } = useNotionContext()
  const { block } = props
  
  // Dynamically import Collection component
  const [CollectionComponent, setCollectionComponent] = React.useState<any>(null)
  
  React.useEffect(() => {
    import('react-notion-x/build/third-party/collection').then((m) => {
      setCollectionComponent(() => m.Collection)
    })
  }, [])
  
  // If Collection component is not loaded yet, show loading
  if (!CollectionComponent) {
    return <div className="notion-collection-loading">Loading collection...</div>
  }
  
  // If block has view_ids, check if there's a list view and make it default
  if (block?.view_ids && recordMap?.collection_view) {
    const listViewId = block.view_ids.find((viewId: string) => {
      const view = recordMap.collection_view[viewId]?.value
      return view?.type === 'list'
    })
    
    // If we found a list view and it's not the first one, reorder
    if (listViewId && block.view_ids[0] !== listViewId) {
      const modifiedBlock = {
        ...block,
        view_ids: [listViewId, ...block.view_ids.filter((id: string) => id !== listViewId)]
      }
      return <CollectionComponent {...props} block={modifiedBlock} />
    }
  }
  
  // Otherwise render normally
  return <CollectionComponent {...props} />
}

export default CollectionWithDefaultListView