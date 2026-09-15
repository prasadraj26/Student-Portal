import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div>
      <h1>Teacher Dashboard</h1>

      <p>
        Welcome, {currentUser?.email}
      </p>

      <button onClick={handleLogout}>
        Logout
      </button>

      <hr />

      <h2>Dashboard</h2>

      <div>
        <h3>Students</h3>
        <p>0</p>
      </div>

      <div>
        <h3>Active Exams</h3>
        <p>0</p>
      </div>

      <div>
        <h3>Completed Exams</h3>
        <p>0</p>
      </div>
    </div>
  );
}

export default Dashboard;