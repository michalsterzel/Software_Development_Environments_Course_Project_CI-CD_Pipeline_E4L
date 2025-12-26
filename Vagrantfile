# -*- mode: ruby -*-
# vi: set ft=ruby :

# DevOps Project VM Configuration
# Michal - Infrastructure & CI/CD

Vagrant.configure("2") do |config|
  # Ubuntu 22.04 LTS (Jammy Jellyfish)
  config.vm.box = "ubuntu/jammy64"
  
  # VM hostname
  config.vm.hostname = "devops-vm"

  # Network configuration - Private network for host access
  config.vm.network "private_network", ip: "192.168.56.10"
  
  # Port forwarding for GitLab web interface
  config.vm.network "forwarded_port", guest: 80, host: 8080, host_ip: "127.0.0.1"
  
  # Port forwarding for GitLab SSH
  config.vm.network "forwarded_port", guest: 22, host: 2222, id: "ssh", auto_correct: true
  
  # Port forwarding for development environments (adjust as needed)
  config.vm.network "forwarded_port", guest: 3000, host: 3000, host_ip: "127.0.0.1"
  config.vm.network "forwarded_port", guest: 8000, host: 8000, host_ip: "127.0.0.1"
  config.vm.network "forwarded_port", guest: 5432, host: 5432, host_ip: "127.0.0.1"

  # Sync project folder to VM
  config.vm.synced_folder ".", "/vagrant"
  
  # Sync ansible folder to VM provisioning location
  config.vm.synced_folder "./ansible", "/vagrant/ansible"

  # VirtualBox provider configuration
  config.vm.provider "virtualbox" do |vb|
    # VM display name in VirtualBox
    vb.name = "DevOps-Project-VM"
    
    # Do not display the VirtualBox GUI when booting
    vb.gui = false
    
    # Memory: 6GB
    vb.memory = "6144"
    
    # CPU cores: 4
    vb.cpus = 4
    
    # Enable nested virtualization (for Docker)
    vb.customize ["modifyvm", :id, "--nested-hw-virt", "on"]
    
    # Increase video memory for better performance
    vb.customize ["modifyvm", :id, "--vram", "128"]
    
    # Enable DNS proxy to use host's DNS
    vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
    
    # Enable I/O APIC for multi-core support
    vb.customize ["modifyvm", :id, "--ioapic", "on"]
  end

  # Ansible Local provisioning (runs Ansible inside the VM)
  config.vm.provision "ansible_local" do |ansible|
    ansible.playbook = "/vagrant/ansible/playbook.yml"
    ansible.verbose = true
    ansible.install = true
    ansible.install_mode = "default"
    ansible.compatibility_mode = "2.0"
  end

  # Post-provisioning message
  config.vm.post_up_message = <<-MSG
    ============================================
    DevOps Project VM is ready!
    ============================================
    
    VM IP: 192.168.56.10
    GitLab URL: http://localhost:8080
    
    To access the VM:
      vagrant ssh
    
    To get GitLab root password:
      vagrant ssh -c "sudo cat /etc/gitlab/initial_root_password"
    
    Next steps:
    1. Access GitLab and create your project
    2. Register GitLab Runner
    3. Push code and watch the CI/CD pipeline
    
    ============================================
  MSG
end
