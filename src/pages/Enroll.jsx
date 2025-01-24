/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import Sidebar from "../components/layouts/Sidebar";
import api from "../instance/TokenInstance";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import Modal from "../components/modals/Modal";
import DataTable from "../components/layouts/Datatable";

const Enroll = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [TableEnrolls, setTableEnrolls] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalUpdate, setShowModalUpdate] = useState(false);
  const [currentUpdateGroup, setCurrentUpdateGroup] = useState(null);
  const [availableTickets, setAvailableTickets] = useState([]);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [availableTicketsAdd, setAvailableTicketsAdd] = useState([]);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    group_id: "",
    user_id: "",
    no_of_tickets: "",
  });

  const [updateFormData, setUpdateFormData] = useState({
    group_id: "",
    user_id: "",
    tickets: "",
  });

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get("/group/get-group");
        console.log(response);
        setGroups(response.data);
      } catch (error) {
        console.error("Error fetching group data:", error);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get("/user/get-user");
        console.log(response);
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleGroupChange = async (event) => {
    const groupId = event.target.value;
    setSelectedGroup(groupId);

    if (groupId) {
      try {
        const response = await api.get(`/enroll/get-group-enroll/${groupId}`);
        if (response.data && response.data.length > 0) {
          setFilteredUsers(response.data);
          const formattedData = response.data.map((group, index) => ({
            id: index + 1,
            name: group?.user_id?.full_name,
            phone_number: group?.user_id?.phone_number,
            ticket: group.tickets,
            action: (
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleUpdateModalOpen(group._id)}
                  className="border border-green-400 text-white px-4 py-2 rounded-md shadow hover:border-green-700 transition duration-200"
                >
                  <CiEdit color="green" />
                </button>
                <button
                  onClick={() => handleDeleteModalOpen(group._id)}
                  className="border border-red-400 text-white px-4 py-2 rounded-md shadow hover:border-red-700 transition duration-200"
                >
                  <MdDelete color="red" />
                </button>
              </div>
            )
          }));
          setTableEnrolls(formattedData)
        } else {
          setFilteredUsers([]);
        }
      } catch (error) {
        console.error("Error fetching enrollment data:", error);
        setFilteredUsers([]);
      }
    } else {
      setFilteredUsers([]);
    }
  };

  const columns = [
    { key: 'id', header: 'SL. NO' },
    { key: 'name', header: 'Customer Name' },
    { key: 'phone_number', header: 'Customer Phone Number' },
    { key: 'ticket', header: 'Ticket Number' },
    { key: 'action', header: 'Action' },
  ];

  const handleChange = async (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "group_id") {
      try {
        const response = await api.post(`/enroll/get-next-tickets/${value}`);
        setAvailableTicketsAdd(response.data.availableTickets || []);
        console.log("Next tickets:", response.data.availableTickets);
      } catch (error) {
        console.error("Error fetching next tickets:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    const { no_of_tickets, group_id, user_id } = formData;
    const ticketsCount = parseInt(no_of_tickets, 10);
    const ticketEntries = availableTicketsAdd
      .slice(0, ticketsCount)
      .map((ticketNumber) => ({
        group_id,
        user_id,
        no_of_tickets,
        tickets: ticketNumber,
      }));
    console.log(ticketEntries);

    try {
      for (const ticketEntry of ticketEntries) {
        await api.post("/enroll/add-enroll", ticketEntry, {
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      alert("User Enrolled Successfully");
      window.location.reload();
      setShowModal(false);
      setFormData({
        group_id: "",
        user_id: "",
        no_of_tickets: "",
      });
    } catch (error) {
      console.error("Error enrolling user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleUpdateModalOpen = async (enrollId) => {
    try {
      const response = await api.get(`/enroll/get-enroll-by-id/${enrollId}`);
      setCurrentUpdateGroup(response.data);
      setUpdateFormData({
        group_id: response.data.group_id._id,
        user_id: response.data.user_id._id,
        tickets: response.data.tickets,
      });
      setShowModalUpdate(true);
    } catch (error) {
      console.error("Error fetching enrollment:", error);
    }
  };

  const handleDeleteModalOpen = async (groupId) => {
    try {
      const response = await api.get(`/enroll/get-enroll-by-id/${groupId}`);
      setCurrentGroup(response.data);
      setShowModalDelete(true);
    } catch (error) {
      console.error("Error fetching enroll:", error);
    }
  };

  const handleDeleteGroup = async () => {
    if (currentGroup) {
      try {
        await api.delete(`/enroll/delete-enroll/${currentGroup._id}`);
        alert("Enroll deleted successfully");
        setShowModalDelete(false);
        setCurrentGroup(null);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting group:", error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(
        `/enroll/update-enroll/${currentUpdateGroup._id}`,
        updateFormData
      );
      setShowModalUpdate(false);
      alert("Enrollment Updated Successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error updating enroll:", error);
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      api
        .post(`/enroll/get-next-tickets/${selectedGroup}`)
        .then((response) => {
          setAvailableTickets(response.data.availableTickets || []);
        })
        .catch((error) => {
          console.error("Error fetching available tickets:", error);
        });
    } else {
      setAvailableTickets([]);
    }
  }, [selectedGroup]);

  return (
    <>
      <div>
        <div className="flex mt-20">
          <Sidebar />
          <div className="flex-grow p-7">
            <h1 className="text-2xl font-semibold">Enrollments</h1>
            <div className="mt-6 mb-8">
              <div className="mb-2">
                <label>Select Group</label>
              </div>
              <div className="flex justify-between items-center w-full">
                <select
                  value={selectedGroup}
                  onChange={handleGroupChange}
                  className="border border-gray-300 rounded px-6 py-2 shadow-sm outline-none w-full max-w-md"
                >
                  <option value="">Select Group</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowModal(true)}
                  className="ml-4 bg-blue-700 text-white px-4 py-2 rounded shadow-md hover:bg-blue-800 transition duration-200"
                >
                  + Add Enrollment
                </button>
              </div>
            </div>
            <DataTable data={TableEnrolls} columns={columns} />
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-6">
              {filteredUsers.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500 text-lg">
                    {selectedGroup
                      ? "No enrollment is present for the selected group"
                      : "Select Group to View"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="bg-white border border-gray-300 rounded-xl p-6 shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <div className="flex flex-col items-center">
                      <h2 className="text-xl font-bold mb-3 text-gray-700 text-center">
                        {user.user_id?.full_name}
                      </h2>
                      <div className="flex gap-16 py-3">
                        <p className="text-gray-500 mb-2 text-center">
                          <span className="font-medium text-gray-700 text-xl">
                            {user.user_id?.phone_number}
                          </span>
                          <br />
                          <span className="font-bold text-sm">
                            Phone Number
                          </span>
                        </p>
                        <p className="text-gray-500 mb-4 text-center">
                          <span className="font-medium text-gray-700 text-xl">
                            {user.tickets}
                          </span>
                          <br />
                          <span className="font-bold text-sm">Ticket No</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleUpdateModalOpen(user._id)}
                        className="hidden border border-green-400 text-white px-4 py-2 rounded-md shadow hover:border-green-700 transition duration-200"
                      >
                        <CiEdit color="green" />
                      </button>
                      <button
                        onClick={() => handleDeleteModalOpen(user._id)}
                        className="border border-red-400 text-white px-4 py-2 rounded-md shadow hover:border-red-700 transition duration-200"
                      >
                        <MdDelete color="red" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div> */}
          </div>
        </div>
        <Modal isVisible={showModal} onClose={() => setShowModal(false)}>
          <div className="py-6 px-5 lg:px-8 text-left">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              Add Enrollment
            </h3>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="w-full">
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor="category"
                >
                  Group
                </label>
                <select
                  name="group_id"
                  id="group_id"
                  value={formData.group_id}
                  onChange={handleChange}
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                >
                  <option value="">Select Group</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full">
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor="category"
                >
                  Customer
                </label>
                <select
                  name="user_id"
                  id="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                >
                  <option value="">Select Customer</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>
              {
                formData.group_id && availableTicketsAdd.length === 0 ? (
                  <>
                    <p className="text-center text-red-600">Group is Full</p>
                  </>
                ) : formData.group_id && availableTicketsAdd.length !== 0 ? (
                  <div>
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="email"
                    >
                      Number of Tickets
                    </label>
                    <input
                      type="number"
                      name="no_of_tickets"
                      value={formData.no_of_tickets}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (value <= availableTicketsAdd.length) {
                          handleChange(e);
                        } else {
                          alert(`You can only select up to ${availableTicketsAdd.length} tickets.`);
                        }
                      }}
                      id="name"
                      placeholder="Enter the Number of Tickets"
                      required
                      max={availableTicketsAdd.length}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                    <span className="mt-10">Only {availableTicketsAdd.length} tickets left</span>
                  </div>
                ) : (
                  <p className="text-center text-red-600"></p>
                )
              }
              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
                  }`}
              >
                {
                  loading ? (
                    <>
                      <p>Loading...</p>
                    </>
                  ) : (
                    <>
                      Add
                    </>
                  )
                }
              </button>
            </form>
          </div>
        </Modal>
        <Modal isVisible={showModalUpdate} onClose={() => setShowModalUpdate(false)}>
          <div className="py-6 px-5 lg:px-8 text-left">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Update Enrollment</h3>
            <form className="space-y-6" onSubmit={handleUpdate}>
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-900" htmlFor="group_id">
                  Group
                </label>
                <select
                  name="group_id"
                  id="group_id"
                  value={updateFormData.group_id}
                  onChange={handleInputChange}
                  required
                  disabled
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                >
                  <option value="">Select Group</option>
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-900" htmlFor="user_id">
                  Customer
                </label>
                <select
                  name="user_id"
                  id="user_id"
                  value={updateFormData.user_id}
                  onChange={handleInputChange}
                  required
                  disabled
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                >
                  <option value="">Select Customer</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900" htmlFor="no_of_tickets">
                  Select Ticket
                </label>
                <select
                  name="tickets"
                  value={updateFormData.tickets}
                  onChange={handleInputChange}
                  id="no_of_tickets"
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                >
                  <option value="">Select Ticket</option>
                  {availableTickets.concat([updateFormData.tickets]).map((ticket, index) => (
                    <option key={index} value={ticket}>
                      {ticket}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Update
              </button>
            </form>
          </div>
        </Modal>
        <Modal
          isVisible={showModalDelete}
          onClose={() => {
            setShowModalDelete(false);
            setCurrentGroup(null);
          }}
        >
          <div className="py-6 px-5 lg:px-8 text-left">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              Sure want to remove this Enrollment ?
            </h3>
            {currentGroup && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleDeleteGroup();
                }}
                className="space-y-6"
              >
                <button
                  type="submit"
                  className="w-full text-white bg-red-700 hover:bg-red-800
          focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  Remove
                </button>
              </form>
            )}
          </div>
        </Modal>
      </div>
    </>
  );
};

export default Enroll;
