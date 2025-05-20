import {useState, useEffect, useRef} from 'react'
import {io} from "socket.io-client"
import {ServerURL} from "../../constants"
import {RefreshCcwDot, Clipboard, Send, LogOut, HardDriveDownload} from "lucide-react"
import {useNavigate} from "react-router-dom"

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [soc, setSoc] = useState(null);
  const [msg, setMsg] = useState('');
  const [users, setUsers] = useState([]);
  const [convo, setConvo] = useState([]);
  const convoEndRef = useRef(null);

  useEffect(()=>{
    scrollToEnd();
  }, [convo])
  
  useEffect(()=>{
    if(soc!=null){
      soc.on("message", (chatObj)=>{
        setConvo(convo=>[...convo, chatObj]);
      })
      soc.on("new connection", (uname, udata)=>{
        setUsers(udata);
        const cobj = {
          room:room, userName: "TempBot", message: `User ${uname} has connected!`
        }
        setConvo(convo=>[...convo, cobj])
      })
      soc.on("user disconnected", (uname, udata)=>{
        setUsers(udata);
        const cobj = {
          room:room, userName: "TempBot", message: `User ${uname} has disconnected!`
        }
        setConvo(convo=>[...convo, cobj])
      })
    }

    
  },[soc])
 
  const genRoom = ()=>{
    setRoom(room=>Math.random().toString(36).substring(2, 8));
  }

  const copyRoom = ()=>{
    navigator.clipboard.writeText(room);
  }
  
  const sendMsg = ()=>{
      const mObj = {
          room: room, 
          userName: userName,
          message: msg,
      }
      soc.emit("message", mObj);
      setMsg("");
  }

  const join = ()=>{
    const socket = io(ServerURL, {
      query: {
          room: room,
          userName: userName
      }
    });
    setJoined(true);
    setSoc(socket);
  }

  const leave = async ()=>{
    soc.disconnect();
    setSoc(null);
    setJoined(false);
    setConvo([]);
    navigate("/");
  }

  const scrollToEnd = ()=>{
    convoEndRef.current?.scrollIntoView({behaviour: "smooth"});
  }

  const download = () => {
    const jsonString = JSON.stringify(convo, undefined, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chat.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e)=>{
    
    if(e.key==='Enter'){
      if(joined){
        sendMsg();
      } else {
        join();
      }
    }
  }
  
  return (
    <>
      {joined ? (
        <div className='flex flex-col items-center gap-10 min-h-screen p-2 bg-lime-300'>
          <div className='flex gap-5 p-2 w-full justify-center items-center fixed top-0 bg-amber-300'>
            <div className='bg-sky-300 p-2 rounded-lg max-w-120'>
              <h1>Name: {userName}</h1>
              <h1>Room: {room}</h1>
            </div>
            <div className='bg-sky-300 p-2 rounded-lg max-w-120'>
              <h1>Users in The Room</h1>
              {users.map((u)=>{
                if(u!=userName){
                return (<span>{u} </span>)
                }
              })}
            </div>
            <div className='bg-sky-300 p-2 rounded-lg max-w-120 flex gap-5'>
              <LogOut onClick={leave} className='cursor-pointer'/>
              <HardDriveDownload className='cursor-pointer' onClick={download}/>
            </div>
          </div>
          <div className='overflow-y-auto my-24'>
            {convo.map((obj,index)=>{
              return (<div className='text-xl' key={index}>{obj.userName} : {obj.message}</div>)
            })}
            <div ref={convoEndRef}/>
          </div>


          <div className='fixed bottom-0 flex justify-center items-center py-5 gap-5 w-full bg-amber-300'>
            <input type='text' className='border border-black text-2xl' value={msg} onKeyDown={handleKeyDown} onChange={(e)=>{
              setMsg(e.target.value);
            }}/>
            <Send className='cursor-pointer text-2xl' onClick={sendMsg}/>
          </div>
        </div>      
      ) : (
        <div className='flex flex-col justify-center items-center gap-10 min-h-screen bg-lime-300'>
        <h1 className='text-5xl text-center'>TempChat</h1>
        <div className='flex flex-col justify-center items-center gap-2 p-2 bg-sky-300 rounded-lg max-w-120'>
          <div className='flex gap-5 items-center'>
            <h2>Room:</h2>
            <input className='border border-black p-1' type='text' value={room} onChange={(e)=>{
              setRoom(e.target.value);
            }}/>
            <RefreshCcwDot className='cursor-pointer' onClick={genRoom} />
            <Clipboard className='cursor-pointer' onClick={copyRoom} />
          </div>
          <div className='flex gap-5 items-center w-full'>
            <h2>Name: </h2>
            <input className='border border-black p-1' type='text' onKeyDown={handleKeyDown} value={userName} onChange={(e)=>{
              setUserName(e.target.value);
            }}/>
          </div>
          <button className='p-1 bg-amber-300 rounded-md cursor-pointer' onClick={join}>Join Chat</button>
        </div>
        </div>
      )}
    </>
  )
}

export default Home