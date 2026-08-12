import { supabase } from './supabase';

const fromRecord = (record) => ({
  id: record.id,
  name: record.name,
  department: record.departments?.name || 'Unassigned',
  stage: record.stage[0].toUpperCase() + record.stage.slice(1),
  health: record.health === 'at_risk' ? 'At risk' : record.health[0].toUpperCase() + record.health.slice(1),
  training: ['Completed', 'In process', 'Soon'].includes(record.validated_value) ? record.validated_value : undefined,
  detail: record.current_status,
  accent: record.accent,
  roadmapStage: record.roadmap_stage,
  nextStep: record.next_step,
  targetDate: record.target_date
});

const toDbStage = (stage) => stage.toLowerCase();
const toDbHealth = (health) => health.toLowerCase().replace(' ', '_');

export async function loadSolutions() {
  const { data, error } = await supabase
    .from('solutions')
    .select('id, name, stage, health, validated_value, current_status, accent, roadmap_stage, next_step, target_date, departments(name)')
    .order('name');
  if (error) throw error;
  return data.map(fromRecord);
}

export async function saveRemoteSolution(solution) {
  let { data: department, error: departmentError } = await supabase
    .from('departments')
    .select('id')
    .eq('name', solution.department)
    .maybeSingle();
  if (departmentError) throw departmentError;

  if (!department) {
    const { data, error } = await supabase
      .from('departments')
      .insert({ name: solution.department })
      .select('id')
      .single();
    if (error) throw error;
    department = data;
  }

  const record = {
    id: solution.id,
    name: solution.name,
    department_id: department.id,
    stage: toDbStage(solution.stage),
    health: toDbHealth(solution.health),
    validated_value: solution.training,
    current_status: solution.detail,
    accent: solution.accent,
    roadmap_stage: solution.roadmapStage,
    next_step: solution.nextStep || '',
    target_date: solution.targetDate || null
  };
  const { error } = await supabase.from('solutions').upsert(record);
  if (error) throw error;
  return solution;
}

export async function deleteRemoteSolution(id) {
  const { error } = await supabase.from('solutions').delete().eq('id', id);
  if (error) throw error;
}
