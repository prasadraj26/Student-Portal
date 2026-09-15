import { useEffect, useState } from "react";
import {
  addStudent,
  getStudents,
  deactivateStudent,
} from "../services/studentService";

function Students() {
  const [students, setStudents] = useState([]);

  const [name, setName] = useState("");
  const [classId, setClassId] = useState("10A");
  const [rollNumber, setRollNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load students.");
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !rollNumber) {
      setMessage("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const studentId = await addStudent({
        name,
        classId,
        rollNumber,
      });

      setMessage(`Student ${studentId} added successfully.`);

      setName("");
      setRollNumber("");

      await loadStudents();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Failed to add student.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (studentId) => {
    try {
      await deactivateStudent(studentId);
      await loadStudents();
    } catch (error) {
      console.error(error);
      setMessage("Failed to deactivate student.");
    }
  };

  return (
    <div>
      <h1>Students</h1>

      <h2>Add Student</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Student Name</label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter student name"
          />
        </div>

        <div>
          <label>Class</label>

          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="10A">10 A</option>
            <option value="10B">10 B</option>
            <option value="11A">11 A</option>
            <option value="11B">11 B</option>
          </select>
        </div>

        <div>
          <label>Roll Number</label>

          <input
            type="number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder="01"
            min="1"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Student"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <hr />

      <h2>Student List</h2>

      {students.length === 0 ? (
        <p>No students added yet.</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Class</th>
              <th>Roll No</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.studentId}</td>
                <td>{student.name}</td>
                <td>{student.classId}</td>
                <td>{student.rollNumber}</td>
                <td>
                  {student.active ? "Active" : "Inactive"}
                </td>
                <td>
                  {student.active && (
                    <button
                      onClick={() =>
                        handleDeactivate(student.id)
                      }
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Students;