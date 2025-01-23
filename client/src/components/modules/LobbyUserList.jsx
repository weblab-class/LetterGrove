import React from "react";
import { useState, useEffect } from "react";
import { get, post } from "../../utilities";
import { socket } from "../../client-socket";
import PlayerDisplay from "../modules/PlayerDisplay.jsx";
import testProfilePicture from "../../assets/TestingPFP.png";

/**
 * LobbyPlayerList is a component that represents a list of players in a lobby
 *
 * @param {Object} props
 * @param {string} props.userId - Current user's ID
 */
const LobbyUserList = (props) => {
  const [usernameList, setUsernameList] = useState([]);
  useEffect(() => {
    const handleUpdateLobbyUserList = (players) => {
      let tempUsernameList = [];
      for (let userId in players) {
        tempUsernameList.push({
          playerId: userId,
          username: players[userId],
        });
      }
      setUsernameList(tempUsernameList);
    };
    socket.on("update lobby user list", handleUpdateLobbyUserList);
    return () => {
      socket.off("update lobby user list", handleUpdateLobbyUserList);
    };
  }, []);

  return (
    <div>
      {usernameList.map((player, index) => (
        <PlayerDisplay
          key={index}
          name={player.username}
          profilePicture={testProfilePicture}
          playerId={player.playerId}
          currentUserId={props.userId}
        />
      ))}
    </div>
  );
};

export default LobbyUserList;
