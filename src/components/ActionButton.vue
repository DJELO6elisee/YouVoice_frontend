<template>
    <button class="fab">
        <i class="fa-solid fa-microphone"></i>
    </button>
</template>

<script setup>
// No script logic needed
</script>

<style scoped>
.fab {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #4a4a8a; /* Dark purple/blue */
    color: white;
    border: none;
    font-size: 28px; /* Adjust icon size */
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: background-color 0.2s;
}

.fab:hover {
    background-color: #3a3a6a; /* Darker shade on hover */
}
</style>