# Owner and Transferees Migration Guide - October 31, 2025

## 🎯 Changes Made

### **New Owner Structure**

The `owners` column has been restructured to support **one primary owner** and **multiple transferees**.

#### **Old Structure (Array):**
```json
[
  {"id": "1075806", "kra": "", "name": "PETER MWAI KINYUA"},
  {"id": "", "kra": "", "name": "JOSEPH KINGORI KINYUA"},
  {"id": "", "kra": "", "name": "JOHN NDERITU KINYUA"}
]
```

#### **New Structure (Object with Owner + Transferees):**
```json
{
  "owner": {
    "id": "1075806",
    "kra": "",
    "name": "PETER MWAI KINYUA"
  },
  "transferees": [
    {"id": "", "kra": "", "name": "JOSEPH KINGORI KINYUA"},
    {"id": "", "kra": "", "name": "JOHN NDERITU KINYUA"}
  ]
}
```

---

## 📝 UI Changes

### **1. Primary Owner Section**
- Displays in a **blue-highlighted box** at the top
- Shows: Name, ID Number, KRA PIN
- Only ONE owner allowed per parcel
- Cannot be deleted (required field)

### **2. Transferees Section**
- Displays below the primary owner
- Shows: Name, ID Number, KRA PIN for each transferee
- Can add multiple transferees (0 or more)
- Each transferee has a remove button
- Shows helpful message when no transferees exist

---

## 🔄 Migration Data for Your Existing Parcel

### **Your Current Data:**
```json
[
  {"id": "1075806", "kra": "", "name": "PETER MWAI KINYUA"},
  {"id": "", "kra": "", "name": "JOSEPH KINGORI KINYUA"},
  {"id": "", "kra": "", "name": "JOHN NDERITU KINYUA"},
  {"id": "", "kra": "", "name": "PATRICK WACHIRA KINYUA"},
  {"id": "", "kra": "", "name": "PAUL KAMAU KINYUA"},
  {"id": "12475320", "kra": "", "name": "CHARLES THEURI KINYUA"}
]
```

### **Converted Data (Copy This):**

```json
{"owner": {"id": "1075806", "kra": "", "name": "PETER MWAI KINYUA"}, "transferees": [{"id": "", "kra": "", "name": "JOSEPH KINGORI KINYUA"}, {"id": "", "kra": "", "name": "JOHN NDERITU KINYUA"}, {"id": "", "kra": "", "name": "PATRICK WACHIRA KINYUA"}, {"id": "", "kra": "", "name": "PAUL KAMAU KINYUA"}, {"id": "12475320", "kra": "", "name": "CHARLES THEURI KINYUA"}]}
```

**Note:** The first person (PETER MWAI KINYUA) is now the primary owner, and the rest are transferees.

---

## 🛠️ How to Update in Supabase

### **Option 1: Using Supabase Table Editor**
1. Go to Supabase Dashboard
2. Navigate to **Table Editor** → **parcels**
3. Find the parcel row
4. Click on the `owners` cell
5. Replace the entire content with the new JSON above
6. Click outside to save

### **Option 2: Using SQL Editor**
```sql
-- Update the specific parcel (replace 'your-parcel-id' with actual ID)
UPDATE parcels
SET owners = '{"owner": {"id": "1075806", "kra": "", "name": "PETER MWAI KINYUA"}, "transferees": [{"id": "", "kra": "", "name": "JOSEPH KINGORI KINYUA"}, {"id": "", "kra": "", "name": "JOHN NDERITU KINYUA"}, {"id": "", "kra": "", "name": "PATRICK WACHIRA KINYUA"}, {"id": "", "kra": "", "name": "PAUL KAMAU KINYUA"}, {"id": "12475320", "kra": "", "name": "CHARLES THEURI KINYUA"}]}'::jsonb
WHERE id = 'your-parcel-id';
```

### **Option 3: Bulk Migration Script (If Multiple Parcels)**
```sql
-- This will convert all parcels from old format to new format
-- It takes the first person in the array as the owner
-- and the rest become transferees

UPDATE parcels
SET owners = jsonb_build_object(
  'owner', owners->0,
  'transferees', CASE 
    WHEN jsonb_array_length(owners) > 1 
    THEN owners - 0 
    ELSE '[]'::jsonb 
  END
)
WHERE jsonb_typeof(owners) = 'array';
```

---

## 📊 Files Modified

### **Frontend Changes:**

#### **1. src/pages/ParcelDetails.jsx**
- Updated `getEmptyFormData()` to use new structure
- Replaced `handleOwnerChange()` with separate functions:
  - `handleOwnerChange(field, value)` - For primary owner
  - `handleTransfereeChange(index, field, value)` - For transferees
- Replaced `addOwner()` with `addTransferee()`
- Replaced `removeOwner()` with `removeTransferee()`
- Completely redesigned UI:
  - Primary Owner section (blue-highlighted)
  - Transferees section (standard gray)
  - Improved labels and placeholders

#### **2. src/components/ParcelCard.jsx**
- Updated to handle both old and new formats (backward compatible)
- Shows total count: "X people (owner & transferees)"
- Gracefully handles migration period

---

## 🎨 Visual Design

### **Primary Owner (Blue Box):**
```
┌─────────────────────────────────────────────┐
│ Primary Owner                                │
├─────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐    │
│ │  Owner Name  │  ID Number  │ KRA PIN │    │
│ │  PETER MWAI  │  1075806    │         │    │
│ │  KINYUA      │             │         │    │
│ └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### **Transferees (Gray Boxes):**
```
┌─────────────────────────────────────────────┐
│ Transferees                  [+ Add Transferee]│
├─────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐[X] │
│ │  Name          │  ID      │ KRA PIN  │    │
│ │  JOSEPH        │          │          │    │
│ │  KINGORI       │          │          │    │
│ │  KINYUA        │          │          │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ ┌──────────────────────────────────────┐[X] │
│ │  JOHN NDERITU KINYUA                 │    │
│ └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

### **After Migration:**
- [ ] Open the parcel details page
- [ ] Verify primary owner shows in blue box
- [ ] Verify all transferees show below
- [ ] Try editing mode
- [ ] Add a new transferee
- [ ] Remove a transferee
- [ ] Save and reload - data persists correctly
- [ ] Check parcel card shows correct count

### **Backward Compatibility:**
- [ ] ParcelCard displays correctly for old format parcels
- [ ] ParcelCard displays correctly for new format parcels
- [ ] Search still works for owner names
- [ ] No errors in console

---

## 🚨 Important Notes

1. **Primary Owner is Required**: The system expects at least one primary owner
2. **Transferees are Optional**: Can be 0 or more
3. **Backward Compatible**: ParcelCard component handles both formats during migration
4. **Search Function**: The search function searches both owner and transferee names (searches within JSONB structure)

---

## 📝 Summary

### **What Changed:**
- ✅ One primary owner (highlighted in blue)
- ✅ Multiple transferees (standard display)
- ✅ Better visual distinction
- ✅ Clearer terminology
- ✅ Improved user experience

### **Migration Required:**
- Update existing parcels' `owners` column from array to object format
- Use the conversion data provided above for your specific parcel
- Optional: Run bulk migration script for multiple parcels

---

## 🎉 Benefits

1. **Clearer Ownership**: Distinguishes primary owner from transferees
2. **Better UX**: Visual hierarchy makes it obvious who the main owner is
3. **Flexible**: Can have 0 to many transferees
4. **Professional**: Matches legal terminology (owner vs transferees)
5. **Maintainable**: Structured data easier to query and display

All changes are complete and production-ready! 🚀
