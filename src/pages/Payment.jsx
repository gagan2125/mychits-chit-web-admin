/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import Sidebar from "../components/layouts/Sidebar";
import api from "../instance/TokenInstance";
import { MdDelete } from "react-icons/md";
import { CiEdit } from "react-icons/ci";
import Modal from "../components/modals/Modal";
import { BsEye } from "react-icons/bs";
import UploadModal from "../components/modals/UploadModal";
import axios from "axios";
import url from "../data/Url";

const Payment = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedAuctionGroup, setSelectedAuctionGroup] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedAuctionGroupId, setSelectedAuctionGroupId] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredAuction, setFilteredAuction] = useState([]);
  const [groupInfo, setGroupInfo] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [showModalUpdate, setShowModalUpdate] = useState(false);
  const [currentUpdateGroup, setCurrentUpdateGroup] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [receiptNo, setReceiptNo] = useState("");

  const [formData, setFormData] = useState({
    group_id: "",
    user_id: "",
    ticket: "",
    receipt_no: "",
    pay_date: "",
    amount: "",
    pay_mode: "",
  });

  const handleModalClose = () => setShowUploadModal(false);

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
    const fetchReceipt = async () => {
      try {
        const response = await api.get("/payment/get-latest-receipt");
        console.log(response);
        setReceiptNo(response.data);
      } catch (error) {
        console.error("Error fetching receipt data:", error);
      }
    };
    fetchReceipt();
  }, []);

  useEffect(() => {
    if (receiptNo) {
      setFormData((prevData) => ({
        ...prevData,
        receipt_no: receiptNo.receipt_no,
      }));
    }
  }, [receiptNo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleChangeUser = (e) => {
    const { name, value } = e.target;
    const [user_id, ticket] = value.split("-");
    setFormData((prevData) => ({
      ...prevData,
      user_id,
      ticket,
    }));
  };

  const handleGroupChange = async (groupId) => {
    setSelectedGroup(groupId);

    if (groupId) {
      try {
        const response = await api.get(`/enroll/get-group-enroll/${groupId}`);
        if (response.data && response.data.length > 0) {
          setFilteredUsers(response.data);
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

  const handleGroup = async (event) => {
    const groupId = event.target.value;
    setSelectedGroupId(groupId);
    setFormData((prevFormData) => ({
      ...prevFormData,
      group_id: groupId,
    }));

    handleGroupChange(groupId);

    if (groupId) {
      try {
        const response = await api.get(`/group/get-by-id-group/${groupId}`);
        console.log("API Response:", response.data);
        setGroupInfo(response.data || {});
      } catch (error) {
        console.error("Error fetching group data:", error);
        setGroupInfo({});
      }
    } else {
      setGroupInfo({});
    }
  };

  const handleGroupPayment = async (event) => {
    const groupId = event.target.value;
    setSelectedAuctionGroupId(groupId);
    handleGroupPaymentChange(groupId);
  };

  const handleGroupPaymentChange = async (groupId) => {
    setSelectedAuctionGroup(groupId);
    if (groupId) {
      try {
        const response = await api.get(`/payment/get-group-payment/${groupId}`);
        if (response.data && response.data.length > 0) {
          setFilteredAuction(response.data);
        } else {
          setFilteredAuction([]);
        }
      } catch (error) {
        console.error("Error fetching payment data:", error);
        setFilteredAuction([]);
      }
    } else {
      setFilteredAuction([]);
    }
  };

  useEffect(() => {
    if (groupInfo && formData.bid_amount) {
      const commission = (groupInfo.group_value * 5) / 100 || 0;
      const win_amount =
        (groupInfo.group_value || 0) - (formData.bid_amount || 0);
      const divident = (formData.bid_amount || 0) - commission;
      const divident_head = groupInfo.group_members
        ? divident / groupInfo.group_members
        : 0;
      const payable = (groupInfo.group_install || 0) - divident_head;

      setFormData((prevData) => ({
        ...prevData,
        group_id: groupInfo._id,
        commission,
        win_amount,
        divident,
        divident_head,
        payable,
      }));
    }
  }, [groupInfo, formData.bid_amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/payment/add-payment", formData);
      if (response.status === 201) {
        alert("Payment Added Successfully");
        window.location.reload();
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error submitting payment data:", error);
    }
  };

  const handleDeleteModalOpen = async (groupId) => {
    try {
      const response = await api.get(`/payment/get-payment-by-id/${groupId}`);
      setCurrentGroup(response.data);
      setShowModalDelete(true);
    } catch (error) {
      console.error("Error fetching enroll:", error);
    }
  };

  const handleDeleteAuction = async () => {
    if (currentGroup) {
      try {
        await api.delete(`/payment/delete-payment/${currentGroup._id}`);
        alert("Payment deleted successfully");
        setShowModalDelete(false);
        setCurrentGroup(null);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting auction:", error);
      }
    }
  };

  const handleUpdateModalOpen = async (groupId) => {
    try {
      const response = await api.get(`/auction/get-auction-by-id/${groupId}`);
      setCurrentUpdateGroup(response.data);
      setShowModalUpdate(true);
    } catch (error) {
      console.error("Error fetching auction:", error);
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();

    const formDatas = new FormData();
    const fileInput = e.target.file;
    if (fileInput && fileInput.files[0]) {
      formDatas.append("file", fileInput.files[0]);

      try {
        const response = await api.post(`/payment/payment-excel`, formDatas, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.status === 200) {
          alert("File uploaded successfully!");
          window.location.reload();
          setShowUploadModal(false);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload file.");
      }
    } else {
      alert("Please select a file to upload.");
    }
  };

  return (
    <>
      <div>
        <div className="flex mt-20">
          <Sidebar />
          <div className="flex-grow p-7">
            <h1 className="text-2xl font-semibold">Payments</h1>
            <div className="mt-6 mb-8">
              <div className="mb-2">
                <label>Select Group</label>
                <div className="flex justify-between items-center w-full">
                  <select
                    value={selectedAuctionGroupId}
                    onChange={handleGroupPayment}
                    className="border border-gray-300 rounded px-6 py-2 shadow-sm outline-none w-full max-w-md"
                  >
                    <option value="">Select Group</option>
                    {groups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.group_name}
                      </option>
                    ))}
                  </select>
                  <div>
                    <button
                      onClick={() => setShowModal(true)}
                      className="ml-4 bg-blue-700 text-white px-4 py-2 rounded shadow-md hover:bg-blue-800 transition duration-200"
                    >
                      + Add Payment
                    </button>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="ml-4 bg-yellow-300 text-black px-4 py-2 rounded shadow-md hover:bg-yellow-400 transition duration-200"
                    >
                      Upload Excel
                    </button>
                  </div>
                </div>
              </div>
              <UploadModal
                show={showUploadModal}
                onClose={handleModalClose}
                onSubmit={handleFileSubmit}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-6">
                {filteredAuction.length === 0 ? (
                  <div className="flex justify-center items-center h-64">
                    <p className="text-gray-500 text-lg">
                      {selectedAuctionGroup
                        ? "No Payments is present for the selected group"
                        : "Select Group to View"}
                    </p>
                  </div>
                ) : (
                  filteredAuction.map((user) => (
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
                              {user.ticket}
                            </span>
                            <br />
                            <span className="font-bold text-sm">Ticket</span>
                          </p>
                          <p className="text-gray-500 mb-4 text-center">
                            <span className="font-medium text-gray-700 text-xl">
                              {user.amount}
                            </span>
                            <br />
                            <span className="font-bold text-sm">Amount</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        {/* <button
                          onClick={() => handleUpdateModalOpen(user._id)}
                          className="border border-green-400 text-white px-4 py-2 rounded-md shadow hover:border-green-700 transition duration-200"
                        >
                          <BsEye color="green" />
                        </button> */}
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
              </div>
            </div>
          </div>
          <Modal isVisible={showModal} onClose={() => setShowModal(false)}>
            <div className="py-6 px-5 lg:px-8 text-left">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                Add Payment
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
                    value={selectedGroupId}
                    onChange={handleGroup}
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
                    Users
                  </label>
                  <select
                    name="user_id"
                    value={`${formData.user_id}-${formData.ticket}`}
                    onChange={handleChangeUser}
                    required
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                  >
                    <option value="">Select User</option>
                    {filteredUsers.map((user) => (
                      <option
                        key={`${user.user_id._id}-${user.tickets}`}
                        value={`${user.user_id._id}-${user.tickets}`}
                      >
                        {user.user_id.full_name} | {user.tickets}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-row justify-between space-x-4">
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_value"
                    >
                      Receipt No.
                    </label>
                    <input
                      type="text"
                      name="receipt_no"
                      value={formData.receipt_no}
                      id="receipt_no"
                      placeholder="Receipt No."
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_install"
                    >
                      Payment Date
                    </label>
                    <input
                      type="date"
                      name="pay_date"
                      value={formData.pay_date}
                      id="pay_date"
                      onChange={handleChange}
                      placeholder=""
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                </div>
                <div className="flex flex-row justify-between space-x-4">
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_value"
                    >
                      Amount
                    </label>
                    <input
                      type="text"
                      name="amount"
                      value={formData.amount}
                      id="amount"
                      onChange={handleChange}
                      placeholder="Enter Amount"
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_install"
                    >
                      Payment Mode
                    </label>
                    <input
                      type="text"
                      name="pay_mode"
                      value="cash"
                      id="pay_mode"
                      placeholder=""
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full text-white bg-blue-700 hover:bg-blue-800
              focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  Add
                </button>
              </form>
            </div>
          </Modal>
          <Modal
            isVisible={showModalUpdate}
            onClose={() => setShowModalUpdate(false)}
          >
            <div className="py-6 px-5 lg:px-8 text-left">
              <h3 className="mb-4 text-xl font-bold text-gray-900">
                View Auction
              </h3>
              <form className="space-y-6" onSubmit={() => {}}>
                <div>
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900"
                    htmlFor="email"
                  >
                    Group
                  </label>
                  <input
                    type="text"
                    name="group_id"
                    value={currentUpdateGroup?.group_id?.group_name}
                    onChange={() => {}}
                    id="name"
                    placeholder="Enter the Group Name"
                    readOnly
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                  />
                </div>
                <div className="flex flex-row justify-between space-x-4">
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_value"
                    >
                      Group Value
                    </label>
                    <input
                      type="text"
                      name="group_value"
                      value={currentUpdateGroup?.group_id?.group_value}
                      id="group_value"
                      placeholder="select group to check"
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_install"
                    >
                      Group Installment
                    </label>
                    <input
                      type="text"
                      name="group_install"
                      value={currentUpdateGroup?.group_id?.group_install}
                      id="group_install"
                      placeholder="select group to check"
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900"
                    htmlFor="email"
                  >
                    User
                  </label>
                  <input
                    type="text"
                    name="group_id"
                    value={`${currentUpdateGroup?.user_id?.full_name} | ${currentUpdateGroup?.ticket}`}
                    onChange={() => {}}
                    id="name"
                    placeholder="Enter the User Name"
                    readOnly
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                  />
                </div>

                <div>
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900"
                    htmlFor="email"
                  >
                    Bid Amount
                  </label>
                  <input
                    type="number"
                    name="bid_amount"
                    value={
                      currentUpdateGroup?.group_id?.group_value -
                      currentUpdateGroup?.win_amount
                    }
                    onChange={() => {}}
                    id="name"
                    placeholder="Enter the Bid Amount"
                    readOnly
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                  />
                </div>
                <div className="flex flex-row justify-between space-x-4">
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_value"
                    >
                      Commission
                    </label>
                    <input
                      type="text"
                      name="commission"
                      value={currentUpdateGroup?.commission}
                      id="commission"
                      placeholder=""
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_install"
                    >
                      Winning Amount
                    </label>
                    <input
                      type="text"
                      name="win_amount"
                      value={currentUpdateGroup?.win_amount}
                      id="win_amount"
                      placeholder=""
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                </div>
                <div className="flex flex-row justify-between space-x-4">
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_value"
                    >
                      Divident
                    </label>
                    <input
                      type="text"
                      name="divident"
                      value={currentUpdateGroup?.divident}
                      id="divident"
                      placeholder=""
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_install"
                    >
                      Divident per Head
                    </label>
                    <input
                      type="text"
                      name="divident_head"
                      value={currentUpdateGroup?.divident_head}
                      id="divident_head"
                      placeholder=""
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="group_install"
                    >
                      Next Payable
                    </label>
                    <input
                      type="text"
                      name="payable"
                      value={currentUpdateGroup?.payable}
                      id="payable"
                      placeholder=""
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                </div>
                <div className="flex flex-row justify-between space-x-4">
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="date"
                    >
                      Auction Date
                    </label>
                    <input
                      type="date"
                      name="auction_date"
                      value={currentUpdateGroup?.auction_date}
                      onChange={() => {}}
                      id="date"
                      placeholder="Enter the Date"
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                  <div className="w-1/2">
                    <label
                      className="block mb-2 text-sm font-medium text-gray-900"
                      htmlFor="date"
                    >
                      Next Date
                    </label>
                    <input
                      type="date"
                      name="next_date"
                      value={currentUpdateGroup?.next_date}
                      onChange={() => {}}
                      id="date"
                      placeholder="Enter the Date"
                      readOnly
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                    />
                  </div>
                </div>
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
                Sure want to delete this Payment ?
              </h3>
              {currentGroup && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDeleteAuction();
                  }}
                  className="space-y-6"
                >
                  <button
                    type="submit"
                    className="w-full text-white bg-red-700 hover:bg-red-800
                    focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    Delete
                  </button>
                </form>
              )}
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default Payment;