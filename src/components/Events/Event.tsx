/* eslint-disable @typescript-eslint/no-explicit-any */
import { authenticate, useMetaMask } from '~/hooks/useMetaMask'
import styles from './Event.module.css'
import { useEffect, useState } from 'react'
import { formatAddress } from '~/utils'

export const Event = () => {

  const { wallet } = useMetaMask()

  const [ events, setEvents ] = useState<Array<any>>([])
  const [eventName, setEventName] = useState('')
  const [createButton, setCreateButton] = useState(true)
  const [currentKey, setCurrentKey] = useState('')
  const [reload, setReload] = useState(false)

  const alertAndReload = (data: any) => {
    alert(data.message)
    if(!data.error) {
      if(data.status === '401') {
        authenticate(wallet.accounts[0])
      }
      setEventName('')
      setReload(!reload)
    }
  }

  const deleteEvent = async (e: any, key: string) => {
    const response = await fetch(`http://3.89.157.115:3000/api/v1/events/${key}`, {
      method: 'delete',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('_token')}`,
      },
    })
    const data = await response.json()
    alertAndReload(data)
  }

  const createEvent =  async() => {
    const body = JSON.stringify({
      name: eventName,
    })
    const response = await fetch(`http://3.89.157.115:3000/api/v1/events`, {
      method: 'post',
      body,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('_token')}`,
      },
    })
    const data = await response.json()
    alertAndReload(data)
  }

  const updateEvent =  async() => {
    const body = JSON.stringify({
      name: eventName,
    })
    const response = await fetch(`http://3.89.157.115:3000/api/v1/events/${currentKey}`, {
      method: 'put',
      body,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('_token')}`,
      },
    })
    const data = await response.json()
    alertAndReload(data)
  }

  const changeUpdateButton = (e: any, event?: any) => {
    if(e.target.value === 'true') {
      setCreateButton(false)
      setCurrentKey(event.id)
      setEventName(event.name)
    } else {
      setCreateButton(true)
      setCurrentKey('')
      setEventName('')
    }
  }

  // fetch
  useEffect(() => {
    // search for token in local storage and fetch event
    const fetchEvents = async () => {
      const result = await fetch('http://3.89.157.115:3000/api/v1/events')
      const {
        data,
      } = await result.json()
      setEvents(data)
    }
    
    fetchEvents()

  }, 
  [reload])

  return (
    <div className={styles.display}>
      {wallet.accounts.length > 0 &&
        <>
          <h3>EVENTS</h3>
          <div style={{ marginBottom: '30px' }}>
            <input style={{ marginRight: '20px', padding: '12.5px 20px', border: '1px solid #F2F7FF', borderRadius: '5px', height: '15px' }} onChange={e => setEventName(e.target.value)} placeholder="Event Name" value={eventName} />
            {
              createButton ? (
                <button onClick={() => createEvent()}>Create Event</button>
              ) : 
                (
                  <>
                    <button onClick={() => updateEvent()} style={{ marginRight: '20px' }}> Update Event </button>
                    <button onClick={e => changeUpdateButton(e)}> X </button>
                  </>
                )
            }
          </div>
          {
            events && events.length > 0 ? 
              (
                <table>
                  <thead>
                    <tr>
                      <td> Name </td>
                      <td> Event Owner </td>
                      <td> Update </td>
                      <td> Delete </td>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      events.map(event => (
                        <tr key={event.id}>
                          <td> {event.name} </td>
                          <td> {formatAddress(event.user?.walletAddress)} </td>
                          <td><button value="true" onClick={e => changeUpdateButton(e, event)}>Update</button></td>
                          <td><button onClick={e => deleteEvent(e, event.id)}>Delete</button></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              ) : <> No Events Yet </>
          }
        </>
      }
    </div>
  )
}