// export default GroupSettings;
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { EyeIcon } from "lucide-react";
import Modal from "../components/modals/Modal";
import api from "../instance/TokenInstance";
import DataTable from "../components/layouts/Datatable";
import CustomAlert from "../components/alerts/CustomAlert";

const GroupSettings = () => {
  const [groups, setGroups] = useState([]);
  const [TableGroups, setTableGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModalUpdate, setShowModalUpdate] = useState(false);
  const [currentUpdateGroup, setCurrentUpdateGroup] = useState(null);
  const [updatingGroups, setUpdatingGroups] = useState(new Set());

  const [alertConfig, setAlertConfig] = useState({
    visibility: false,
    message: "Something went wrong!",
    type: "info",
  });

  const [updateFormData, setUpdateFormData] = useState({
    group_name: "",
    group_type: "",
    group_value: "",
    group_install: "",
    group_members: "",
    group_duration: "",
    start_date: "",
    end_date: "",
    minimum_bid: "",
    maximum_bid: "",
    commission: 5,
    reg_fee: "",
  });

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get("/group/get-group");
        setGroups(response.data);
      } catch (error) {
        console.error("Error fetching group data:", error);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    const formattedData = groups.map((group, index) => ({
      checkBox: (
        <div className="flex justify-center gap-2">
          <div className="border border-red-400 text-white px-4 py-2 rounded-md shadow hover:border-red-700 transition duration-200">
            <input
              type="checkbox"
              checked={group.mobile_access}
              onChange={() =>
                handleMobileAccessChange(group._id, !group.mobile_access)
              }
              disabled={updatingGroups.has(group._id)}
              className="form-checkbox h-4 w-4 text-red-600 focus:ring-0 focus:ring-offset-0 focus:outline-none checked:bg-red-600 border-gray-300 rounded"
            />
          </div>
        </div>
      ),
      id: index + 1,
      name: group.group_name,
      type: `${group.group_type
        .charAt(0)
        .toUpperCase()}${group.group_type.slice(1)} Group`,
      value: group.group_value,
      installment: group.group_install,
      members: group.group_members,
      action: (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleUpdateModalOpen(group._id)}
            className="border border-green-400 text-white px-4 py-2 rounded-md shadow hover:border-green-700 transition duration-200"
          >
            <EyeIcon color="green" />
          </button>
        </div>
      ),
    }));
    setTableGroups(formattedData);
  }, [groups, searchTerm, updatingGroups]);

  const handleMobileAccessChange = async (groupId, newValue) => {
    setUpdatingGroups((prev) => new Set([...prev, groupId]));

    try {
      // Optimistic update
      setGroups((prev) =>
        prev.map((group) =>
          group._id === groupId ? { ...group, mobile_access: newValue } : group
        )
      );

      await api.patch(`/group/update-mobile-access/${groupId}`, {
        mobile_access: newValue,
      });
    } catch (error) {
      // Revert on error
      setGroups((prev) =>
        prev.map((group) =>
          group._id === groupId ? { ...group, mobile_access: !newValue } : group
        )
      );
      console.error("Error updating mobile access:", error);
      setAlertConfig({
        message: "Failed to update mobile access",
        type: "error",
        visibility: true,
      });
    } finally {
      setUpdatingGroups((prev) => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  const handleUpdateModalOpen = async (groupId) => {
    try {
      const response = await api.get(`/group/get-by-id-group/${groupId}`);
      const groupData = response.data;
      const formattedStartDate = groupData.start_date.split("T")[0];
      const formattedEndDate = groupData.end_date.split("T")[0];
      setCurrentUpdateGroup(response.data);
      setUpdateFormData({
        group_name: response.data.group_name,
        group_type: response.data.group_type,
        group_value: response.data.group_value,
        group_install: response.data.group_install,
        group_members: response.data.group_members,
        group_duration: response.data.group_duration,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        minimum_bid: response.data.minimum_bid,
        maximum_bid: response.data.maximum_bid,
        reg_fee: response.data.reg_fee,
      });
      setShowModalUpdate(true);
    } catch (error) {
      console.error("Error fetching group:", error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const isValid = validateForm();

    try {
      if (isValid) {
        await api.put(
          `/group/update-group/${currentUpdateGroup._id}`,
          updateFormData
        );
        setShowModalUpdate(false);
        setAlertConfig({
          message: "Group updated successfully",
          type: "success",
          visibility: true,
        });
      }
    } catch (error) {
      console.error("Error updating group:", error);
    }
  };

  const columns = [
    { key: "checkBox", header: "Mobile Access" },
    { key: "id", header: "SL. NO" },
    { key: "name", header: "Group Name" },
    { key: "type", header: "Group Type" },
    { key: "value", header: "Group Value" },
    { key: "installment", header: "Group Installment" },
    { key: "members", header: "Group Members" },
    { key: "action", header: "Action" },
  ];

  return (
    <>
      <div>
        <CustomAlert
          type={alertConfig.type}
          isVisible={alertConfig.visibility}
          message={alertConfig.message}
        />
        <div className="flex mt-20">
          <div className="flex-grow p-7">
            <div className="mt-6 mb-8">
              <div className="flex justify-between items-center w-full">
                <h1 className="text-2xl font-semibold">Groups</h1>
              </div>
            </div>

            <DataTable
              data={TableGroups}
              columns={columns}
              exportedFileName={`Groups-${
                TableGroups.length > 0
                  ? TableGroups[0].name +
                    " to " +
                    TableGroups[TableGroups.length - 1].name
                  : "empty"
              }.csv`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"></div>
          </div>
        </div>
        <Modal
          isVisible={showModalUpdate}
          onClose={() => setShowModalUpdate(false)}
        >
          <div className="py-6 px-5 lg:px-8 text-left">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Group</h3>
            <form className="space-y-6" onSubmit={handleUpdate} noValidate>
              <div>
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor="email"
                >
                  Group Name
                </label>
                <input
                  type="text"
                  name="group_name"
                  value={updateFormData.group_name}
                  id="name"
                  placeholder="Enter the Group Name"
                  readOnly
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                />
              </div>
              <div className="w-full">
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor="category"
                >
                  Group Type
                </label>
                <select
                  name="group_type"
                  value={updateFormData.group_type || ""}
                  readOnly
                  id="category"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                >
                  <option readOnly value="">
                    Select Group Type
                  </option>
                  <option readOnly value="divident">
                    Dividend Group
                  </option>
                  <option readOnly value="double">
                    Double Group
                  </option>
                </select>
              </div>

              <div className="flex flex-row justify-between space-x-4">
                <div className="w-1/2">
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900"
                    htmlFor="date"
                  >
                    Group Value
                  </label>
                  <input
                    type="number"
                    name="group_value"
                    value={updateFormData.group_value}
                    id="text"
                    placeholder="Enter Group Value"
                    readOnly
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                  />
                </div>
                <div className="w-1/2">
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900"
                    htmlFor="date"
                  >
                    Group Installment Amount
                  </label>
                  <input
                    type="number"
                    name="group_install"
                    value={updateFormData.group_install}
                    id="text"
                    placeholder="Enter Group Installment Amount"
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
                    Group Members
                  </label>
                  <input
                    type="number"
                    name="group_members"
                    value={updateFormData.group_members}
                    id="text"
                    placeholder="Enter Group Members"
                    readOnly
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                  />
                </div>
                <div className="w-1/2">
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900"
                    htmlFor="date"
                  >
                    Group Duration
                  </label>
                  <input
                    type="number"
                    name="group_duration"
                    value={updateFormData.group_duration}
                    readOnly
                    id="text"
                    placeholder="Enter Group Duration"
                    required
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                  />
                </div>
              </div>
              <div>
                <label
                  className="block mb-2 text-sm font-medium text-gray-900"
                  htmlFor="email"
                >
                  Registration Fee
                </label>
                <input
                  type="number"
                  name="reg_fee"
                  value={updateFormData.reg_fee}
                  id="name"
                  placeholder="Enter the Registration Fee"
                  readOnly
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                />
              </div>
              <div className="flex flex-row justify-between space-x-4">
                <div className="w-1/2">
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900"
                    htmlFor="date"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={updateFormData.start_date}
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
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={updateFormData.end_date}
                    readOnly
                    id="date"
                    placeholder="Enter the Date"
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
                    Minimum Bid %
                  </label>
                  <input
                    type="number"
                    name="minimum_bid"
                    value={updateFormData.minimum_bid}
                    readOnly
                    id="text"
                    placeholder="Enter Minimum Bid"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                  />
                </div>
                <div className="w-1/2">
                  <label
                    className="block mb-2 text-sm font-medium text-gray-900"
                    htmlFor="date"
                  >
                    Maximum Bid %
                  </label>
                  <input
                    type="number"
                    name="maximum_bid"
                    value={updateFormData.maximum_bid}
                    readOnly
                    id="text"
                    placeholder="Enter Maximum Bid"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full p-2.5"
                  />
                </div>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default GroupSettings;
