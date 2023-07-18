import random
class RaftServer:
    def __init__(self, server_id, num_servers):
        self.server_id = server_id
        self.num_servers = num_servers
        
        self.current_term = 0
        self.voted_for = None
        self.log = []
        self.commit_index = 0
        self.last_applied = 0
        
        self.state = 'follower'
        self.election_timeout = self.generate_election_timeout()
        self.election_timeout_elapsed = 0
        
        self.next_index = [len(self.log) + 1] * self.num_servers
        self.match_index = [0] * self.num_servers
    
    def generate_election_timeout(self):
        # Generate a random election timeout between 150ms and 300ms
        return random.uniform(0.15, 0.3)
    
    def reset_election_timeout(self):
        self.election_timeout_elapsed = 0
        self.election_timeout = self.generate_election_timeout()
    
    def request_vote(self, term, candidate_id, last_log_index, last_log_term):
        granted = False
        
        if term > self.current_term:
            self.current_term = term
            self.voted_for = None
            self.state = 'follower'
        
        if self.current_term == term and (self.voted_for is None or self.voted_for == candidate_id):
            candidate_last_log_term = self.log[last_log_index]['term'] if last_log_index < len(self.log) else None
            
            if last_log_term == candidate_last_log_term or last_log_index >= len(self.log):
                self.voted_for = candidate_id
                granted = True
        
        return {
            'term': self.current_term,
            'vote_granted': granted,
        }
    
    def append_entries(self, term, leader_id, prev_log_index, prev_log_term, entries, leader_commit):
        success = False
        
        if term > self.current_term:
            self.current_term = term
            self.state = 'follower'
        
        if term == self.current_term:
            if prev_log_index == 0 or (prev_log_index <= len(self.log) and self.log[prev_log_index - 1]['term'] == prev_log_term):
                i = prev_log_index
                j = 0
                while i <= len(self.log) and j < len(entries):
                    if i <= len(self.log) and self.log[i - 1]['term'] != entries[j]['term']:
                        self.log = self.log[:i - 1]
                        break
                    if i > len(self.log):
                        self.log.append(entries[j])
                    i += 1
                    j += 1
                
                if leader_commit > self.commit_index:
                    self.commit_index = min(leader_commit, len(self.log))
                
                success = True
        
        return {
            'term': self.current_term,
            'success': success,
        }
    
    def apply_entries_to_state_machine(self):
        while self.commit_index > self.last_applied:
            self.last_applied += 1
            self.apply_entry_to_state_machine(self.log[self.last_applied - 1])
    
    def apply_entry_to_state_machine(self, entry):
        # Apply the entry to the state machine
        pass
    
    def start_election(self):
        self.current_term += 1
        self.voted_for = self.server_id
        self.state = 'candidate'
        
        self.reset_election_timeout()
        
        votes_received = 1
        
        for i in range(self.num_servers):
            if i == self.server_id:
                continue
            
            last_log_index = len
