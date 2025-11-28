import { useEffect, useState } from "react";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function blankSchedule() {
  return {
    mon: { enabled: false, start: "", end: "" },
    tue: { enabled: false, start: "", end: "" },
    wed: { enabled: false, start: "", end: "" },
    thu: { enabled: false, start: "", end: "" },
    fri: { enabled: false, start: "", end: "" },
    sat: { enabled: false, start: "", end: "" },
    sun: { enabled: false, start: "", end: "" }
  };
}

export default function App() {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");

  // Load from chrome storage
  useEffect(() => {
    if (chrome?.storage) {
      chrome.storage.sync.get(["groups"], (res) => {
        setGroups(res.groups || []);
      });
    }
  }, []);

  // Save to chrome storage anytime groups change
  const saveGroups = (updated) => {
    setGroups([...updated]);

    if (chrome?.storage) {
      chrome.storage.sync.set({ groups: updated });
    }
  };

  // Add group
  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;

    const newGroup = {
      id: crypto.randomUUID(),
      name,
      sites: [],
      schedule: blankSchedule()
    };

    saveGroups([...groups, newGroup]);
    setNewGroupName("");
  };

  // Add site to group
  const addSite = (groupId, inputValue) => {
    let site = inputValue.trim().toLowerCase();
    if (!site) return { error: "Empty website" };

    // Normalize URL → hostname
    try {
      if (!site.startsWith("http")) site = "https://" + site;
      site = new URL(site).hostname;
    } catch {
      return { error: "Invalid website format" };
    }

    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      if (g.sites.includes(site)) return g;

      return { ...g, sites: [...g.sites, site] };
    });

    saveGroups(updated);
    return { error: null };
  };

  // Update day schedule
  const updateSchedule = (groupId, day, newValues) => {
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;

      return {
        ...g,
        schedule: {
          ...g.schedule,
          [day]: { ...g.schedule[day], ...newValues }
        }
      };
    });

    saveGroups(updated);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Groups</h1>

      {/* Add new group */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="New group name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <button onClick={addGroup}>Add Group</button>
      </div>

      {/* List groups */}
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          addSite={addSite}
          updateSchedule={updateSchedule}
        />
      ))}
    </div>
  );
}

// GroupCard remains unchanged as the issue was in DayScheduleRow
function GroupCard({ group, addSite, updateSchedule }) {
  const [siteInput, setSiteInput] = useState("");
  const [error, setError] = useState("");

  const handleAddSite = () => {
    const result = addSite(group.id, siteInput);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError("");
    setSiteInput("");
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "15px",
        marginBottom: "20px",
        borderRadius: "8px"
      }}
    >
      <h2>{group.name}</h2>

      {/* Add website */}
      <div>
        <input
          type="text"
          placeholder="Add website (example.com)"
          value={siteInput}
          onChange={(e) => setSiteInput(e.target.value)}
        />
        <button onClick={handleAddSite}>Add Site</button>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* List sites */}
      <ul>
        {group.sites.map((site) => (
          <li key={site}>{site}</li>
        ))}
      </ul>

      {/* Schedule editor */}
      <h3>Weekly Schedule</h3>
      {DAYS.map((day) => (
        <DayScheduleRow
          key={day}
          day={day}
          config={group.schedule[day]}
          update={(vals) => updateSchedule(group.id, day, vals)}
        />
      ))}
    </div>
  );
}

// 🚀 DayScheduleRow is fixed to be fully controlled by props.
function DayScheduleRow({ day, config, update }) {
  // 1. Local state (startTime, endTime) has been removed.

  const toggle = (e) => {
    const enabled = e.target.checked;

    // Validation: Check if both times are set before enabling.
    if (enabled && (!config.start || !config.end)) { 
      alert("Please enter BOTH times before enabling.");
      
      // Stop the checkbox from being checked if validation fails (important!)
      e.preventDefault(); 
      return;
    }

    // Update the parent state for 'enabled'
    update({ enabled });
  };

  // Helper to handle time changes and update the parent state immediately on change
  const handleTimeChange = (field, timeValue) => {
    update({ [field]: timeValue });
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <label>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={toggle}
        />
        {" " + day.toUpperCase()}
      </label>

      <input
        type="time"
        // 2. Value is controlled directly by the prop
        value={config.start} 
        // 3. 'disabled' attribute is removed so user can set times first
        onChange={(e) => handleTimeChange("start", e.target.value)} 
        style={{ marginLeft: "10px" }}
      />

      <input
        type="time"
        // 2. Value is controlled directly by the prop
        value={config.end} 
        // 3. 'disabled' attribute is removed so user can set times first
        onChange={(e) => handleTimeChange("end", e.target.value)}
      />
    </div>
  );
}