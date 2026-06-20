import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

def get_fuzzy_system():
    # Antecedents (Inputs)
    # predicted_duration: let's say from 0 to 300 minutes
    predicted_duration = ctrl.Antecedent(np.arange(0, 301, 1), 'predicted_duration')
    # corridor_priority: 1 (Low), 2 (Medium), 3 (High)
    corridor_priority = ctrl.Antecedent(np.arange(1, 4, 1), 'corridor_priority')

    # Consequents (Outputs)
    # personnel_required: 0 to 20
    personnel_required = ctrl.Consequent(np.arange(0, 21, 1), 'personnel_required')
    # barricades_needed: 0 to 50
    barricades_needed = ctrl.Consequent(np.arange(0, 51, 1), 'barricades_needed')

    # Membership functions for predicted_duration
    predicted_duration['short'] = fuzz.trapmf(predicted_duration.universe, [0, 0, 30, 60])
    predicted_duration['medium'] = fuzz.trimf(predicted_duration.universe, [40, 90, 150])
    predicted_duration['long'] = fuzz.trapmf(predicted_duration.universe, [120, 180, 300, 300])

    # Membership functions for corridor_priority
    # Using trimf for discrete-like priority 1, 2, 3
    corridor_priority['low'] = fuzz.trimf(corridor_priority.universe, [1, 1, 2])
    corridor_priority['medium'] = fuzz.trimf(corridor_priority.universe, [1, 2, 3])
    corridor_priority['high'] = fuzz.trimf(corridor_priority.universe, [2, 3, 3])

    # Membership functions for personnel_required
    personnel_required['low'] = fuzz.trimf(personnel_required.universe, [0, 0, 5])
    personnel_required['medium'] = fuzz.trimf(personnel_required.universe, [3, 8, 12])
    personnel_required['high'] = fuzz.trapmf(personnel_required.universe, [10, 15, 20, 20])

    # Membership functions for barricades_needed
    barricades_needed['low'] = fuzz.trimf(barricades_needed.universe, [0, 0, 15])
    barricades_needed['medium'] = fuzz.trimf(barricades_needed.universe, [10, 25, 35])
    barricades_needed['high'] = fuzz.trapmf(barricades_needed.universe, [30, 40, 50, 50])

    # Rules
    rule1 = ctrl.Rule(predicted_duration['short'] & corridor_priority['low'], 
                      (personnel_required['low'], barricades_needed['low']))
    rule2 = ctrl.Rule(predicted_duration['short'] & corridor_priority['medium'], 
                      (personnel_required['low'], barricades_needed['medium']))
    rule3 = ctrl.Rule(predicted_duration['short'] & corridor_priority['high'], 
                      (personnel_required['medium'], barricades_needed['medium']))

    rule4 = ctrl.Rule(predicted_duration['medium'] & corridor_priority['low'], 
                      (personnel_required['low'], barricades_needed['medium']))
    rule5 = ctrl.Rule(predicted_duration['medium'] & corridor_priority['medium'], 
                      (personnel_required['medium'], barricades_needed['medium']))
    rule6 = ctrl.Rule(predicted_duration['medium'] & corridor_priority['high'], 
                      (personnel_required['high'], barricades_needed['high']))

    rule7 = ctrl.Rule(predicted_duration['long'] & corridor_priority['low'], 
                      (personnel_required['medium'], barricades_needed['medium']))
    rule8 = ctrl.Rule(predicted_duration['long'] & corridor_priority['medium'], 
                      (personnel_required['high'], barricades_needed['high']))
    rule9 = ctrl.Rule(predicted_duration['long'] & corridor_priority['high'], 
                      (personnel_required['high'], barricades_needed['high']))

    # System
    resource_ctrl = ctrl.ControlSystem([rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8, rule9])
    resource_sim = ctrl.ControlSystemSimulation(resource_ctrl)
    
    return resource_sim

def compute_resources(duration_mins: float, priority: int):
    sim = get_fuzzy_system()
    
    # Cap inputs to universes
    dur = max(0, min(300, duration_mins))
    pri = max(1, min(3, priority))
    
    sim.input['predicted_duration'] = dur
    sim.input['corridor_priority'] = pri
    
    # Crunch the numbers
    sim.compute()
    
    personnel = int(round(sim.output['personnel_required']))
    barricades = int(round(sim.output['barricades_needed']))
    
    return personnel, barricades

if __name__ == "__main__":
    p, b = compute_resources(150, 3)
    print(f"Long duration, High Priority -> Personnel: {p}, Barricades: {b}")
